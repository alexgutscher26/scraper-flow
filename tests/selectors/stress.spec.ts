import { describe, it, expect } from "vitest";
import { generateSelectors } from "@/lib/selector/generator";

const html = `<ul>${Array.from({ length: 200 }).map((_, i) => `<li class='item-${i}'>Item ${i}</li>`).join("")}</ul>`;

describe("selector generation stress", () => {
  it("handles high-volume generation under time budget", () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      generateSelectors({ html, description: `Item ${i}` }, { type: "css", mode: "flexible", specificityLevel: 1, maxCandidates: 8 });
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1500);
  });
});
