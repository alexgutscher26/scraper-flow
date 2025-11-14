import { describe, it, expect, vi } from "vitest";
// Do not import route before mocks; we'll import dynamically inside test

vi.mock("@/lib/rateLimit", () => {
  return {
    rateLimit: async () => ({
      user: { allowed: false, limit: 60, remaining: 0, reset: Math.floor(Date.now()/1000)+60 },
      global: { allowed: false, limit: 120, remaining: 0, reset: Math.floor(Date.now()/1000)+60 },
    }),
    applyRateLimitHeaders: (h: Headers, r: any) => {
      h.set("X-RateLimit-Limit", String(r.limit));
      h.set("X-RateLimit-Remaining", String(r.remaining));
      h.set("X-RateLimit-Reset", String(r.reset));
    },
  };
});

vi.mock("@/lib/env", () => {
  return {
    getEnv: () => ({
      API_SECRET: "s",
      STRIPE_SECRET_KEY: "sk",
      STRIPE_WEBHOOK_SECRET: "wh",
      ENCRYPTMENT_SECRET: "enc", // typo intentionally ignored by route
      ENCRYPTION_SECRET: "enc",
      NEXT_PUBLIC_APP_URL: "http://localhost",
      RATE_LIMIT_WINDOW_SECONDS: "60",
      RATE_LIMIT_GLOBAL_CRON: "20",
      RATE_LIMIT_USER_CRON: "10",
      RATE_LIMIT_GLOBAL_EXECUTE: "120",
      RATE_LIMIT_USER_EXECUTE: "60",
    }),
    formatEnvError: (e: any) => String(e),
  };
});

vi.mock("@/lib/workflow/executionWorkflow", () => {
  return { ExecutionWorkflow: async () => {} };
});

vi.mock("@/lib/prisma", () => {
  return {
    default: {
      workflow: {
        findUnique: async () => ({ id: "w1", userId: "u1", definition: "{}", executionPlan: JSON.stringify([{ phase: 1, nodes: [{ data: { type: "navigate" } }] }]), cron: null }),
      },
      workflowExecution: {
        create: async () => ({ id: "e1" }),
      },
    },
  };
});

describe("execute route rate limiting", () => {
  it("returns 429 when rate limit exceeded", async () => {
    const { GET: execGET } = await import("@/app/api/workflows/execute/route");
    const url = "http://localhost/api/workflows/execute?workflowId=w1";
    const req = new Request(url, {
      headers: {
        authorization: "Bearer s",
        "x-user-id": "u1",
      },
    });
    const res = await execGET(req as any, {} as any);
    expect(res.status).toBe(429);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
