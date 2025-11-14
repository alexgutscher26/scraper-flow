import crypto from 'node:crypto';

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = input.replace(/=+$/g, '').toUpperCase().replace(/\s+/g, '');
  let bits = '';
  for (const c of cleaned) {
    const val = alphabet.indexOf(c);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTOTP(
  secretBase32: string,
  options?: { period?: number; digits?: number; timestampMs?: number }
): string {
  const period = options?.period ?? 30;
  const digits = options?.digits ?? 6;
  const timestampMs = options?.timestampMs ?? Date.now();
  const counter = Math.floor(timestampMs / 1000 / period);
  const key = base32Decode(secretBase32);
  const msg = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = (code % 10 ** digits).toString().padStart(digits, '0');
  return otp;
}

export function verifyTOTP(
  secretBase32: string,
  code: string,
  options?: { period?: number; digits?: number; window?: number; timestampMs?: number }
): boolean {
  const period = options?.period ?? 30;
  const digits = options?.digits ?? 6;
  const window = options?.window ?? 1; // +/- 1 step
  const now = options?.timestampMs ?? Date.now();
  for (let w = -window; w <= window; w++) {
    const valid = generateTOTP(secretBase32, {
      period,
      digits,
      timestampMs: now + w * period * 1000,
    });
    if (valid === code) return true;
  }
  return false;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}
