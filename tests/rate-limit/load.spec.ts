import { describe, it, expect, beforeEach, vi } from "vitest";
let mod: typeof import("@/lib/rateLimit");

const store = new Map<string, { count: number }>();

vi.mock("@/lib/prisma", () => {
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

describe("rateLimit load enforcement", () => {
  beforeEach(() => {
    store.clear();
    vi.doMock("@/lib/env", () => ({
      getEnv: () => ({
        API_SECRET: "s",
        STRIPE_SECRET_KEY: "sk",
        STRIPE_WEBHOOK_SECRET: "wh",
        ENCRYPTION_SECRET: "enc",
        NEXT_PUBLIC_APP_URL: "http://localhost",
        RATE_LIMIT_WINDOW_SECONDS: "60",
        RATE_LIMIT_GLOBAL_EXECUTE: "10",
        RATE_LIMIT_USER_EXECUTE: "5",
        RATE_LIMIT_GLOBAL_CRON: "20",
        RATE_LIMIT_USER_CRON: "10",
      }),
    }));
    return import("@/lib/rateLimit").then((m) => {
      mod = m as any;
    });
  });

  it("blocks excess concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }).map(() => mod.rateLimit("execute", "u-load"))
    );
    const blocked = results.filter((r) => !r.user.allowed || !r.global.allowed).length;
    expect(blocked).toBeGreaterThan(0);
  });
});
