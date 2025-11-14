import crypto from 'crypto';
import 'server-only';

const ALG = 'aes-256-cbc';

function resolveKey() {
  const raw = process.env.ENCRYPTION_SECRET;
  if (!raw) {
    throw new Error('encryption key is not set');
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  try {
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length === 32) {
      return b64;
    }
  } catch {}
  return crypto.createHash('sha256').update(raw).digest();
}

export function symmetricEncrypt(data: string) {
  const key = resolveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export const symmetricDecrypt = (encrypted: string) => {
  const key = resolveKey();
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts.shift() as string, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
