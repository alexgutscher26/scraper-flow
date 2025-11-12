import { describe, it, expect } from "vitest";
import { applyHeaders } from "../../lib/politeness/userAgent";
import { PolitenessState, PolitenessConfig } from "../../types/politeness";

function mockPage() {
  const headers: Record<string, string> = {};
  let ua = "";
  return {
    setUserAgent: async (u: string) => {
      ua = u;
    },
    setExtraHTTPHeaders: async (h: Record<string, string>) => {
      Object.assign(headers, h);
    },
    _getUA: () => ua,
    _getHeaders: () => headers,
  } as any;
}

describe("userAgent applyHeaders", () => {
  it("applies UA and headers", async () => {
    const cfg: PolitenessConfig = {
      robots: { enabled: true, enforcement: "strict" },
      delays: { enabled: false, minMs: 0, maxMs: 0, jitterPct: 0, strategy: "uniform" },
      userAgent: { enabled: true, rotateStrategy: "perNavigation", acceptLanguageRandomization: true },
    } as any;
    const st: PolitenessState = { robotsCache: new Map(), uaPerDomain: new Map() } as any;
    const page = mockPage();
    const ua = await applyHeaders(page, cfg, st, "https://example.com");
    expect(typeof ua).toBe("string");
    const hdrs = (page as any)._getHeaders();
    expect(hdrs["accept-language"]).toBeDefined();
  });
});
