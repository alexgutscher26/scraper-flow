import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ProxyManager } from "@/lib/network/proxyManager"
import { NetworkConfig } from "@/types/network"

describe("ProxyManager failover", () => {
  const cfg: NetworkConfig["proxy"] = {
    enabled: true,
    rotateStrategy: "perRequest",
    providers: [{ name: "p", proxies: ["http://p1:8080", "http://p2:8080"] }],
    healthCheckUrl: "https://example.com/health",
    failoverEnabled: true,
  }

  const originalFetch = globalThis.fetch
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    globalThis.fetch = vi.fn(async (url: any) => {
      return { ok: false, status: 503, headers: new Headers() } as any
    }) as any
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.useRealTimers()
    ;(Math.random as any).mockRestore?.()
  })

  it("reselects when validation fails", async () => {
    const pm = new ProxyManager(cfg)
    const sel = await pm.select("https://x.com/")
    expect(sel.proxy).toBe("http://p2:8080")
  })
})
