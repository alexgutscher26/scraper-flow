import crypto from 'node:crypto';

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto
      .randomBytes(9)
      .toString('base64')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 10);
    // Format like XXXX-XXXX
    const code = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(code);
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}
