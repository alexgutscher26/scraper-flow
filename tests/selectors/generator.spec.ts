import { describe, it, expect } from 'vitest';
import { generateSelectors } from '@/lib/selector/generator';

const html = `
<div id="root">
  <header>
    <h1 data-testid="title">Welcome</h1>
  </header>
  <main>
    <button class="btn primary">Buy</button>
    <a href="/products" aria-label="Products">Products</a>
  </main>
</div>`;

describe('selector generator', () => {
  it('generates css and xpath candidates', () => {
    const cs = generateSelectors(
      { html, description: 'Buy' },
      { type: 'both', mode: 'strict', specificityLevel: 2, maxCandidates: 10 }
    );
    expect(cs.length).toBeGreaterThan(0);
    const hasCss = cs.some((c) => c.type === 'css');
    const hasXpath = cs.some((c) => c.type === 'xpath');
    expect(hasCss).toBe(true);
    expect(hasXpath).toBe(true);
  });
  it('ranks unique selectors higher', () => {
    const cs = generateSelectors(
      { html },
      { type: 'css', mode: 'flexible', specificityLevel: 1, maxCandidates: 10 }
    );
    const top = cs[0];
    expect(top.selector.length).toBeGreaterThan(0);
  });
  it('runs under a second', () => {
    const start = Date.now();
    generateSelectors(
      { html },
      { type: 'both', mode: 'flexible', specificityLevel: 1, maxCandidates: 20 }
    );
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});
