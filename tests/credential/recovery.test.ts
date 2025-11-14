import { describe, it, expect } from 'vitest';
import { generateRecoveryCodes, hashRecoveryCode } from '@/lib/credential/recovery';

describe('Recovery codes', () => {
  it('generates and hashes codes', () => {
    const codes = generateRecoveryCodes(5);
    expect(codes.length).toBe(5);
    const h = hashRecoveryCode(codes[0]);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});
