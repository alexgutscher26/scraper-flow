import { describe, it, expect } from 'vitest';
import { sanitizeString } from '../lib/logSecure/sanitizer';

describe('sanitizer performance', () => {
  it('processes 10000 lines quickly', () => {
    const lines = Array.from(
      { length: 10000 },
      (_, i) => `user${i}@example.com token tok_${i}${'x'.repeat(20)} card 4111111111111111`
    );
    const start = Date.now();
    for (const l of lines) sanitizeString(l);
    const dur = Date.now() - start;
    expect(dur).toBeLessThan(2000);
  });
});
