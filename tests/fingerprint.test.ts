import { describe, it, expect } from 'vitest';
import { fingerprint, hasOutputFingerprint, markOutputFingerprint } from '@/lib/idempotency';

describe('output fingerprinting', () => {
  it('generates stable SHA-256 fingerprints', () => {
    const a = { x: 1, y: '2' };
    const b = { y: '2', x: 1 };
    expect(fingerprint(a)).toEqual(fingerprint(b));
  });

  it('marks and detects duplicates in namespace', async () => {
    const ns = `ns:${Date.now()}`;
    const hash = fingerprint({ a: 1 });
    const first = await markOutputFingerprint(ns, hash, 2);
    expect(first).toBe(true);
    const dup = await markOutputFingerprint(ns, hash, 2);
    expect(dup).toBe(false);
    const has = await hasOutputFingerprint(ns, hash);
    expect(has).toBe(true);
  });
});
