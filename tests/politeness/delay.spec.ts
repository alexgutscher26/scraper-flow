import { describe, it, expect } from 'vitest';
import { computeDelayMs } from '../../lib/politeness/delay';
import { defaultPolitenessConfig } from '../../types/politeness';

describe('computeDelayMs', () => {
  it('respects bounds', () => {
    const cfg = defaultPolitenessConfig();
    cfg.delays.enabled = true;
    cfg.delays.minMs = 100;
    cfg.delays.maxMs = 200;
    cfg.delays.jitterPct = 0.1;
    for (let i = 0; i < 20; i++) {
      const ms = computeDelayMs(cfg);
      expect(ms).toBeGreaterThanOrEqual(100);
      expect(ms).toBeLessThanOrEqual(200);
    }
  });
});
