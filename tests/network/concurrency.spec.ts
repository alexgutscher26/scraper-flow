import { describe, it, expect } from 'vitest';
import { ProxyManager } from '@/lib/network/proxyManager';
import { SessionManager } from '@/lib/network/cookieJar';

describe('Concurrent access scenarios', () => {
  it('proxy selection is safe across concurrent calls', async () => {
    const pm = new ProxyManager({
      enabled: true,
      rotateStrategy: 'perRequest',
      providers: [{ name: 'p', proxies: ['http://p1:8080', 'http://p2:8080'] }],
    } as any);
    const urls = Array.from({ length: 20 }).map((_, i) => `https://site${i}.com/`);
    const sels = await Promise.all(urls.map((u) => pm.select(u)));
    expect(sels.filter((s) => !!s.proxy).length).toBe(urls.length);
  });

  it('session jar attaches cookies concurrently without mutation errors', async () => {
    const sm = new SessionManager(1000);
    sm.captureFromResponse('https://a.com/', new Headers([['set-cookie', 'sid=abc; Path=/']]));
    const inits: any[] = Array.from({ length: 10 }).map(() => ({ headers: {} }));
    await Promise.all(
      inits.map((init) => Promise.resolve(sm.attachToRequest('https://a.com/x', init)))
    );
    for (const init of inits) {
      expect(init.headers['Cookie']).toContain('sid=abc');
    }
  });
});
