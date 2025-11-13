import { describe, it, expect } from "vitest"
import { CookieJar } from "@/lib/network/cookieJar"

describe("CookieJar sanitization", () => {
  it("ignores invalid names and oversized values", () => {
    const jar = new CookieJar()
    jar.setCookies(["in v=1"], "https://a.com/")
    const big = "x".repeat(5000)
    jar.setCookies([`b=${big}`], "https://a.com/")
    jar.setCookies(["ok=1"], "https://a.com/")
    const header = jar.cookieHeaderFor("https://a.com/")
    expect(header).toContain("ok=1")
    expect(header).not.toContain("in v=")
    expect(header).not.toContain(`b=${big}`)
  })
})
