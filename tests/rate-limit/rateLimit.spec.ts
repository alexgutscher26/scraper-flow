import { describe, it, expect, beforeEach, vi } from 'vitest';
let mod: typeof import('@/lib/rateLimit');

const store = new Map<string, { count: number }>();

vi.mock('@/lib/prisma', () => {
  return {
    default: {
      rateLimitWindow: {
        upsert: async ({ where, create, update }: any) => {
          const key = `${where.key_windowStart_windowSeconds.key}|${where.key_windowStart_windowSeconds.windowStart.toISOString()}|${where.key_windowStart_windowSeconds.windowSeconds}`;
          const existing = store.get(key);
          if (!existing) {
            store.set(key, { count: create.count });
            return { count: create.count };
          }
          const next = { count: existing.count + (update.count.increment as number) };
          store.set(key, next);
          return next;
        },
      },
    },
  };
});

describe('rateLimit', () => {
  beforeEach(() => {
    store.clear();
    vi.doMock('@/lib/env', () => ({
      getEnv: () => ({
        API_SECRET: 's',
        STRIPE_SECRET_KEY: 'sk',
        STRIPE_WEBHOOK_SECRET: 'wh',
        ENCRYPTION_SECRET: 'enc',
        NEXT_PUBLIC_APP_URL: 'http://localhost',
        RATE_LIMIT_WINDOW_SECONDS: '60',
        RATE_LIMIT_GLOBAL_CRON: '3',
        RATE_LIMIT_USER_CRON: '2',
        RATE_LIMIT_GLOBAL_EXECUTE: '5',
        RATE_LIMIT_USER_EXECUTE: '4',
      }),
    }));
    return import('@/lib/rateLimit').then((m) => {
      mod = m as any;
    });
  });

  it('enforces per-user limit for cron', async () => {
    const user = 'u1';
    const r1 = await mod.rateLimit('cron', user);
    expect(r1.user.allowed).toBe(true);
    const r2 = await mod.rateLimit('cron', user);
    expect(r2.user.allowed).toBe(true);
    const r3 = await mod.rateLimit('cron', user);
    expect(r3.user.allowed).toBe(false);
    expect(r3.user.remaining).toBe(0);
  });

  it('enforces global limit when unauthenticated', async () => {
    const r: any[] = [];
    r.push(await mod.rateLimit('cron', null));
    r.push(await mod.rateLimit('cron', null));
    r.push(await mod.rateLimit('cron', null));
    expect(r[2].global.allowed).toBe(true);
    const r4 = await mod.rateLimit('cron', null);
    expect(r4.global.allowed).toBe(false);
  });

  it('applies headers correctly', async () => {
    const res = await mod.rateLimit('execute', 'u2');
    const h = new Headers();
    mod.applyRateLimitHeaders(h, res.user);
    expect(h.get('X-RateLimit-Limit')).toBe('4');
    expect(Number(h.get('X-RateLimit-Remaining'))).toBeGreaterThanOrEqual(0);
    expect(h.get('X-RateLimit-Reset')).toBeTruthy();
  });
});
