import prisma from '@/lib/prisma';
import { createLogger } from '@/lib/log';
import { getEnv } from '@/lib/env';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // unix epoch seconds
};

type Scope = 'cron' | 'execute';

function nowMs() {
  return Date.now();
}

function windowInfo(windowSeconds: number) {
  const ms = windowSeconds * 1000;
  const startMs = Math.floor(nowMs() / ms) * ms;
  const resetMs = startMs + ms;
  return { start: new Date(startMs), reset: Math.floor(resetMs / 1000) };
}

export async function rateLimit(
  scope: Scope,
  userId?: string | null
): Promise<{ user: RateLimitResult; global: RateLimitResult }> {
  const logger = createLogger('rate-limit');
  const env = getEnv();
  const windowSeconds = Number(env.RATE_LIMIT_WINDOW_SECONDS);

  const cfg = {
    cron: {
      user: Number(env.RATE_LIMIT_USER_CRON),
      global: Number(env.RATE_LIMIT_GLOBAL_CRON),
    },
    execute: {
      user: Number(env.RATE_LIMIT_USER_EXECUTE),
      global: Number(env.RATE_LIMIT_GLOBAL_EXECUTE),
    },
  } as const;

  const { start, reset } = windowInfo(windowSeconds);

  const keys = {
    user: userId ? `user:${userId}:scope:${scope}` : null,
    global: `global:scope:${scope}`,
  };

  const [userRes, globalRes] = await Promise.all([
    keys.user
      ? prisma.rateLimitWindow.upsert({
          where: {
            key_windowStart_windowSeconds: {
              key: keys.user,
              windowStart: start,
              windowSeconds: windowSeconds,
            },
          },
          create: {
            key: keys.user,
            windowStart: start,
            windowSeconds,
            count: 1,
          },
          update: {
            count: { increment: 1 },
          },
        })
      : null,
    prisma.rateLimitWindow.upsert({
      where: {
        key_windowStart_windowSeconds: {
          key: keys.global,
          windowStart: start,
          windowSeconds: windowSeconds,
        },
      },
      create: {
        key: keys.global,
        windowStart: start,
        windowSeconds,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    }),
  ]);

  const uLimit = cfg[scope].user;
  const gLimit = cfg[scope].global;

  const userCount = userRes?.count ?? 0;
  const globalCount = globalRes.count;

  const userAllowed = keys.user ? userCount <= uLimit : true;
  const globalAllowed = globalCount <= gLimit;

  if (!userAllowed) {
    logger.warning(
      `User rate limit exceeded: user=${userId} scope=${scope} count=${userCount}/${uLimit}`
    );
  }
  if (!globalAllowed) {
    logger.warning(`Global rate limit exceeded: scope=${scope} count=${globalCount}/${gLimit}`);
  }

  return {
    user: {
      allowed: userAllowed,
      limit: uLimit,
      remaining: Math.max(0, uLimit - userCount),
      reset,
    },
    global: {
      allowed: globalAllowed,
      limit: gLimit,
      remaining: Math.max(0, gLimit - globalCount),
      reset,
    },
  };
}

export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(result.reset));
}
