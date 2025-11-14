import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@/lib/http';
import { httpMetricsBus } from '@/lib/metrics/http';

describe('HttpClient', () => {
  it('caches JSON within TTL', async () => {
    const client = new HttpClient({ ttlMs: 1000 });
    const fetchSpy = vi
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        })
      );
    const a = await client.get<any>('https://example.com/a');
    const b = await client.get<any>('https://example.com/a');
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('retries transient errors', async () => {
    const client = new HttpClient({ retries: 1, retryOnStatuses: [503] });
    const fetchSpy = vi
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(
        new Response('service down', { status: 503, headers: { 'content-type': 'text/plain' } })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    const res = await client.get<any>('https://example.com/b');
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  it('emits metrics', async () => {
    const client = new HttpClient({ ttlMs: 0 });
    const events: any[] = [];
    httpMetricsBus.on((m) => events.push(m));
    const fetchSpy = vi
      .spyOn(global, 'fetch' as any)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json', 'content-length': '12' },
        })
      );
    await client.get<any>('https://example.com/c');
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].url).toContain('example.com/c');
    fetchSpy.mockRestore();
  });
});
