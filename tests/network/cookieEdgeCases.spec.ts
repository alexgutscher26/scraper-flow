import { describe, it, expect } from "vitest";
import { CookieJar } from "@/lib/network/cookieJar";

describe("CookieJar edge cases", () => {
  it("secure cookies only on https", () => {
    const jar = new CookieJar();
    jar.setCookies(["a=1; Secure"], "https://x.com/");
    expect(jar.cookieHeaderFor("http://x.com/")).toBeUndefined();
    expect(jar.cookieHeaderFor("https://x.com/")).toContain("a=1");
  });

  it("domain leading dot matches subdomains", () => {
    const jar = new CookieJar();
    jar.setCookies(["b=2; Domain=.example.com"], "https://example.com/");
    expect(jar.cookieHeaderFor("https://sub.example.com/")).toContain("b=2");
    expect(jar.cookieHeaderFor("https://other.com/")).toBeUndefined();
  });

  it("path matching requires prefix", () => {
    const jar = new CookieJar();
    jar.setCookies(["c=3; Path=/api"], "https://example.com/");
    expect(jar.cookieHeaderFor("https://example.com/api/users")).toContain("c=3");
    expect(jar.cookieHeaderFor("https://example.com/app")).toBeUndefined();
  });
});
