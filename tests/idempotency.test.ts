import { describe, it, expect } from 'vitest';
import {
  reserveIdempotencyKey,
  completeIdempotencyKey,
  getIdempotencyRecord,
} from '@/lib/idempotency';

describe('idempotency store', () => {
  it('reserves a new key and rejects duplicates', async () => {
    const key = `test:${Date.now()}`;
    const ttl = 2;
    const first = await reserveIdempotencyKey(key, ttl);
    expect(first.reserved).toBe(true);
    const second = await reserveIdempotencyKey(key, ttl);
    expect(second.reserved).toBe(false);
    expect(second.existing?.status).toBe('in_progress');
  });

  it('completes a key and returns cached value for duplicates', async () => {
    const key = `test-complete:${Date.now()}`;
    const ttl = 3;
    const r = await reserveIdempotencyKey(key, ttl);
    expect(r.reserved).toBe(true);
    const payload = { ok: true };
    await completeIdempotencyKey(key, payload, ttl);
    const rec = await getIdempotencyRecord(key);
    expect(rec?.status).toBe('completed');
    expect(rec?.value).toEqual(payload);
    const dup = await reserveIdempotencyKey(key, ttl);
    expect(dup.reserved).toBe(false);
    expect(dup.existing?.value).toEqual(payload);
  });

  it('expires after ttl', async () => {
    const key = `test-expire:${Date.now()}`;
    const ttl = 1;
    await reserveIdempotencyKey(key, ttl);
    await new Promise((r) => setTimeout(r, 1100));
    const again = await reserveIdempotencyKey(key, ttl);
    expect(again.reserved).toBe(true);
  });
});
