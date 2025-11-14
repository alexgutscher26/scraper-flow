import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, applyRateLimitHeaders, RateLimitResult } from '../rateLimit';

function setEnv(vars: Record<string, string>) {
  Object.entries(vars).forEach(([k, v]) => (process.env[k] = v));
}

function headerValues(res: RateLimitResult) {
  const h = new Headers();
  applyRateLimitHeaders(h, res);
  return {
    limit: h.get('X-RateLimit-Limit'),
    remaining: h.get('X-RateLimit-Remaining'),
    reset: h.get('X-RateLimit-Reset'),
    retryAfter: h.get('Retry-After'),
  };
}

describe('rateLimit', () => {
  beforeEach(() => {
    (global as any).__rlStore = new Map();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    setEnv({
      API_SECRET: 's',
      STRIPE_SECRET_KEY: 'sk',
      STRIPE_WEBHOOK_SECRET: 'wh',
      ENCRYPTION_SECRET: 'enc',
      NEXT_PUBLIC_APP_URL: 'http://localhost',
      RATE_LIMIT_WINDOW_SECONDS: '60',
      RATE_LIMIT_GLOBAL_CRON: '5',
      RATE_LIMIT_USER_CRON: '3',
      RATE_LIMIT_GLOBAL_EXECUTE: '10',
      RATE_LIMIT_USER_EXECUTE: '5',
      RATE_LIMIT_PENALTY_BASE_SECONDS: '30',
      RATE_LIMIT_PENALTY_MAX_SECONDS: '300',
    });
  });

  it('applies per-user limits', async () => {
    const userId = 'user-1';
    const r1 = await rateLimit('execute', userId, '1.2.3.4', true);
    expect(r1.user.allowed).toBe(true);
    expect(r1.user.limit).toBe(5);

    for (let i = 0; i < 4; i++) {
      await rateLimit('execute', userId, '1.2.3.4', true);
    }
    const r2 = await rateLimit('execute', userId, '1.2.3.4', true);
    expect(r2.user.allowed).toBe(false);
    const h = headerValues(r2.user);
    expect(h.limit).toBe('5');
    expect(h.remaining).toBe('0');
    expect(h.retryAfter).toBeTruthy();
  });

  it('applies per-endpoint limits', async () => {
    const u = 'user-2';
    for (let i = 0; i < 3; i++) await rateLimit('cron', u, '9.9.9.9', true);
    const rCron = await rateLimit('cron', u, '9.9.9.9', true);
    expect(rCron.user.limit).toBe(3);
    expect(rCron.user.allowed).toBe(false);

    const rExec = await rateLimit('execute', u, '9.9.9.9', true);
    expect(rExec.user.limit).toBe(5);
    expect(rExec.user.allowed).toBe(true);
  });

  it('applies IP throttling stricter for unauthenticated', async () => {
    const ip = '4.4.4.4';
    setEnv({ RATE_LIMIT_IP_LIMITS: JSON.stringify({ cron: 2, execute: 4 }), RATE_LIMIT_UNAUTH_LIMITS: JSON.stringify({ cron: 1, execute: 2 }) });
    const a1 = await rateLimit('execute', null, ip, false);
    expect(a1.ip.allowed).toBe(true);
    await rateLimit('execute', null, ip, false);
    const a2 = await rateLimit('execute', null, ip, false);
    expect(a2.ip.allowed).toBe(false);
    const h = headerValues(a2.ip);
    expect(h.retryAfter).toBeTruthy();

    const ip2 = '5.5.5.5';
    const b1 = await rateLimit('execute', 'u3', ip2, true);
    expect(b1.ip.allowed).toBe(true);
    await rateLimit('execute', 'u3', ip2, true);
    await rateLimit('execute', 'u3', ip2, true);
    const b2 = await rateLimit('execute', 'u3', ip2, true);
    expect(b2.ip.allowed).toBe(true);
  });
});
