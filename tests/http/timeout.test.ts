import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@/lib/http';

describe('HttpClient timeout', () => {
  it('aborts when timeoutMs elapses', async () => {
    const client = new HttpClient({ retries: 0 });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (_input: any, init: any) => {
      return new Promise<Response>((_resolve, reject) => {
        const sig = (init as any)?.signal;
        if (sig) sig.addEventListener('abort', () => reject(new Error('AbortError')));
      }) as any;
    }) as any;
    const start = Date.now();
    await expect(client.get('https://example.com/', { timeoutMs: 10 })).rejects.toBeTruthy();
    globalThis.fetch = originalFetch;
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
  });
});
