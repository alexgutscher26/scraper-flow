import { describe, it, expect, vi } from "vitest";
import { GET as cronGET } from "@/app/api/workflows/cron/route";

vi.mock("@/lib/rateLimit", () => {
  return {
    rateLimit: async () => ({
      user: { allowed: false, limit: 10, remaining: 0, reset: Math.floor(Date.now()/1000)+60 },
      global: { allowed: false, limit: 20, remaining: 0, reset: Math.floor(Date.now()/1000)+60 },
    }),
    applyRateLimitHeaders: (h: Headers, r: any) => {
      h.set("X-RateLimit-Limit", String(r.limit));
      h.set("X-RateLimit-Remaining", String(r.remaining));
      h.set("X-RateLimit-Reset", String(r.reset));
    },
  };
});

describe("cron route rate limiting", () => {
  it("returns 429 when rate limit exceeded", async () => {
    const req = new Request("http://localhost/api/workflows/cron", { headers: { "x-user-id": "u1" } });
    const res = await cronGET(req as any, {} as any);
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});

