import { describe, it, expect } from "vitest";
import { sanitizeString } from "../lib/logSecure/sanitizer";

describe("sanitizeString", () => {
  it("masks emails preserving domain", () => {
    const s = sanitizeString("Contact john.doe@example.com now");
    expect(s).toMatch(/j\*+@example.com/);
    expect(s).toContain("[fp:");
  });

  it("masks credit cards preserving last 4", () => {
    const s = sanitizeString("Card 4111111111111111 used");
    expect(s).toMatch(/\*+1111/);
    expect(s).toContain("[fp:");
  });

  it("masks SSN preserving last 4", () => {
    const s = sanitizeString("SSN 123-45-6789");
    expect(s).toContain("***-**-6789");
    expect(s).toContain("[fp:");
  });

  it("masks JWT tokens", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const s = sanitizeString(`Bearer ${token}`);
    expect(s).toMatch(/\[fp:/);
  });
});
