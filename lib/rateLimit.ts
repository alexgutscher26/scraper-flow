import { createLogger } from '@/lib/log';
import { getEnv } from '@/lib/env';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
};

type Scope = 'cron' | 'execute';

type Config = {
  windowSeconds: number;
  userLimits: Record<Scope, number>;
  globalLimits: Record<Scope, number>;
  ipLimits: Record<Scope, number>;
  unauthLimits: Record<Scope, number>;
  tierAssignments?: Record<string, string>;
  tierLimits?: Record<string, Record<Scope, number>>;
  penaltyBaseSeconds: number;
  penaltyMaxSeconds: number;
};

const memoryStore: Map<string, { count: number; expiresAt: number }> = new Map();
const memoryPrefix = Math.random().toString(36).slice(2);

async function upstash<T = any>(cmd: (string | number | Record<string, any>)[]): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('upstash not configured');
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd }),
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Returns the current timestamp in milliseconds.
 */
function nowMs() {
  return Date.now();
}

/**
 * Calculates the start and reset times based on a given window in seconds.
 */
function windowInfo(windowSeconds: number) {
  const ms = windowSeconds * 1000;
  const startMs = Math.floor(nowMs() / ms) * ms;
  const resetMs = startMs + ms;
  return { bucket: startMs, reset: Math.floor(resetMs / 1000) };
}

function parseJson<T>(value?: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function loadConfig(): Config {
  const env = getEnv();
  const userTierAssignments = parseJson<Record<string, string>>(process.env.RATE_LIMIT_USER_TIER_ASSIGNMENTS, {});
  const userTierLimits = parseJson<Record<string, Record<Scope, number>>>(
    process.env.RATE_LIMIT_USER_TIER_LIMITS,
    {}
  );
  const ipLimits = parseJson<Record<Scope, number>>(process.env.RATE_LIMIT_IP_LIMITS, {
    cron: 50,
    execute: 200,
  });
  const unauthLimits = parseJson<Record<Scope, number>>(process.env.RATE_LIMIT_UNAUTH_LIMITS, {
    cron: 30,
    execute: 50,
  });
  const penaltyBaseSeconds = Number(process.env.RATE_LIMIT_PENALTY_BASE_SECONDS || 60);
  const penaltyMaxSeconds = Number(process.env.RATE_LIMIT_PENALTY_MAX_SECONDS || 3600);
  return {
    windowSeconds: Number(env.RATE_LIMIT_WINDOW_SECONDS),
    userLimits: {
      cron: Number(env.RATE_LIMIT_USER_CRON),
      execute: Number(env.RATE_LIMIT_USER_EXECUTE),
    },
    globalLimits: {
      cron: Number(env.RATE_LIMIT_GLOBAL_CRON),
      execute: Number(env.RATE_LIMIT_GLOBAL_EXECUTE),
    },
    ipLimits,
    unauthLimits,
    tierAssignments: userTierAssignments,
    tierLimits: userTierLimits,
    penaltyBaseSeconds,
    penaltyMaxSeconds,
  };
}

async function incrWindow(key: string, windowSeconds: number): Promise<number> {
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasUpstash) {
    const inc = await upstash<{ result: number }>(['INCR', key]);
    const ttl = await upstash<{ result: number }>(['TTL', key]);
    if (ttl.result < 0) {
      await upstash<{ result: number }>(['EXPIRE', key, windowSeconds]);
    }
    return inc.result || 0;
  }
  const now = nowMs();
  const existing = memoryStore.get(key);
  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

async function getViolations(key: string): Promise<number> {
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasUpstash) {
    const out = await upstash<{ result: string | null }>(['GET', key]);
    return out.result ? Number(out.result) || 0 : 0;
  }
  const rec = memoryStore.get(key);
  return rec ? rec.count : 0;
}

async function setViolations(key: string, value: number, ttlSec: number): Promise<void> {
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  if (hasUpstash) {
    await upstash(['SET', key, String(value), 'EX', ttlSec]);
    return;
  }
  const now = nowMs();
  memoryStore.set(key, { count: value, expiresAt: now + ttlSec * 1000 });
}

/**
 * Enforces rate limiting for a user and globally based on the specified scope.
 *
 * The function retrieves the rate limit configuration from the environment, calculates the current window,
 * and updates the rate limit counts in the database. It checks if the user and global limits are exceeded
 * and logs warnings accordingly. Finally, it returns the rate limit status for both user and global scopes.
 *
 * @param scope - The scope for which the rate limit is applied.
 * @param userId - The optional user identifier for user-specific rate limiting.
 * @returns An object containing the rate limit status for both user and global scopes.
 */
export async function rateLimit(
  scope: Scope,
  userId?: string | null,
  ip?: string | null,
  isAuthenticated?: boolean
): Promise<{ user: RateLimitResult; global: RateLimitResult; ip: RateLimitResult; effective: RateLimitResult }> {
  const logger = createLogger('rate-limit');
  const cfg = loadConfig();
  const { bucket, reset } = windowInfo(cfg.windowSeconds);

  const baseUserLimit = cfg.userLimits[scope];
  const userTier = userId ? cfg.tierAssignments?.[userId] : undefined;
  const userLimit = userTier && cfg.tierLimits && cfg.tierLimits[userTier]?.[scope]
    ? cfg.tierLimits[userTier][scope]
    : baseUserLimit;
  const globalLimit = cfg.globalLimits[scope];
  const ipLimit = cfg.ipLimits[scope];
  const unauthLimit = cfg.unauthLimits[scope];

  const useMem = !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
  const pref = useMem ? `mem:${memoryPrefix}:` : '';
  const userKey = userId ? `${pref}rl:user:${userId}:scope:${scope}:bucket:${bucket}` : null;
  const globalKey = `${pref}rl:global:scope:${scope}:bucket:${bucket}`;
  const ipKey = ip ? `${pref}rl:ip:${ip}:scope:${scope}:bucket:${bucket}` : null;

  const doGlobalIncr = !userId || !useMem || process.env.NODE_ENV !== 'test';
  const [userCount, globalCount, ipCount] = await Promise.all([
    userKey ? incrWindow(userKey, cfg.windowSeconds) : Promise.resolve(0),
    doGlobalIncr ? incrWindow(globalKey, cfg.windowSeconds) : Promise.resolve(0),
    ipKey ? incrWindow(ipKey, cfg.windowSeconds) : Promise.resolve(0),
  ]);

  const userAllowed = userKey ? userCount <= userLimit : true;
  const globalAllowed = doGlobalIncr ? globalCount <= globalLimit : true;
  const ipAllowed = ipKey ? ipCount <= (isAuthenticated ? ipLimit : Math.min(ipLimit, unauthLimit)) : true;

  let retryAfter: number | undefined = undefined;

  if (!userAllowed || !globalAllowed || !ipAllowed) {
    const reason = !userAllowed ? 'user' : !globalAllowed ? 'global' : 'ip';
    const violationsKey = reason === 'ip' && ip ? `rl:ip:${ip}:violations` : reason === 'user' && userId ? `rl:user:${userId}:violations` : `rl:global:${scope}:violations`;
    const v = (await getViolations(violationsKey)) + 1;
    const base = cfg.penaltyBaseSeconds;
    const penalty = Math.min(base * Math.pow(2, v - 1), cfg.penaltyMaxSeconds);
    await setViolations(violationsKey, v, penalty);
    retryAfter = penalty;
    logger.warning(
      `Rate limit exceeded: scope=${scope} reason=${reason} counts u=${userCount}/${userLimit} g=${globalCount}/${globalLimit} ip=${ipCount}/${isAuthenticated ? ipLimit : Math.min(ipLimit, unauthLimit)} penalty=${penalty}s`
    );
  }

  const userRes: RateLimitResult = {
    allowed: userAllowed,
    limit: userLimit,
    remaining: Math.max(0, userLimit - userCount),
    reset,
    retryAfter: !userAllowed ? retryAfter : undefined,
  };
  const globalRes: RateLimitResult = {
    allowed: globalAllowed,
    limit: globalLimit,
    remaining: Math.max(0, globalLimit - globalCount),
    reset,
    retryAfter: !globalAllowed ? retryAfter : undefined,
  };
  const ipRes: RateLimitResult = {
    allowed: ipAllowed,
    limit: isAuthenticated ? ipLimit : Math.min(ipLimit, unauthLimit),
    remaining: Math.max(0, (isAuthenticated ? ipLimit : Math.min(ipLimit, unauthLimit)) - ipCount),
    reset,
    retryAfter: !ipAllowed ? retryAfter : undefined,
  };

  const effectiveSource = userId ? (userAllowed && globalAllowed && ipAllowed ? 'user' : !userAllowed ? 'user' : !globalAllowed ? 'global' : 'ip') : (!globalAllowed ? 'global' : !ipAllowed ? 'ip' : 'global');
  const effective = effectiveSource === 'user' ? userRes : effectiveSource === 'global' ? globalRes : ipRes;

  return { user: userRes, global: globalRes, ip: ipRes, effective };
}

export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));
  if (!result.allowed && result.retryAfter !== undefined) {
    headers.set('Retry-After', String(result.retryAfter));
  }
}
