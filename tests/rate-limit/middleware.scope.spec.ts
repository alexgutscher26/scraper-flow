import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("middleware public route scope", () => {
  it("exposes only cron and execute under /api/workflows", () => {
    const path = resolve(process.cwd(), "middleware.ts");
    const src = readFileSync(path, "utf-8");
    expect(src).toContain("/api/workflows/cron");
    expect(src).toContain("/api/workflows/execute");
    expect(src).not.toContain("/api/workflows/(.*)*");
  });
});

