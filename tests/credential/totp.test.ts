import { describe, it, expect } from 'vitest';
import { generateTOTP, verifyTOTP } from '@/lib/credential/totp';

// RFC test vector: secret "JBSWY3DPEHPK3PXP" corresponds to "Hello!" base32
describe('TOTP', () => {
  it('generates and verifies codes', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const ts = 1710000000000; // fixed time
    const code = generateTOTP(secret, { timestampMs: ts, period: 30, digits: 6 });
    const ok = verifyTOTP(secret, code, { timestampMs: ts, period: 30, digits: 6, window: 0 });
    expect(ok).toBe(true);
  });
});
