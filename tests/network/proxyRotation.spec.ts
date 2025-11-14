import { describe, it, expect } from 'vitest';
import { ProxyManager } from '@/lib/network/proxyManager';
import { NetworkConfig } from '@/types/network';

describe('ProxyManager rotation', () => {
  const cfg: NetworkConfig['proxy'] = {
    enabled: true,
    rotateStrategy: 'perSession',
    providers: [{ name: 'static', proxies: ['http://p1:8080', 'http://p2:8080'] }],
    healthCheckUrl: 'https://example.com',
    failoverEnabled: true,
  };

  it('selects a proxy and keeps perSession', async () => {
    const pm = new ProxyManager(cfg);
    const s1 = await pm.select('https://a.example/');
    const s2 = await pm.select('https://b.example/');
    expect(s1.proxy).toBeTruthy();
    expect(s2.proxy).toBe(s1.proxy);
  });

  it('perDomain strategy isolates selections', async () => {
    const pm = new ProxyManager({ ...cfg, rotateStrategy: 'perDomain' });
    const s1 = await pm.select('https://foo.com/');
    const s2 = await pm.select('https://bar.com/');
    expect(s1.proxy).toBeTruthy();
    expect(s2.proxy).toBeTruthy();
    // May be different; ensure caching works by reselecting
    const s1b = await pm.select('https://foo.com/path');
    expect(s1b.proxy).toBe(s1.proxy);
  });

  it('records successes and failures', async () => {
    const pm = new ProxyManager(cfg);
    const s = await pm.select('https://foo.com/');
    pm.recordSuccess(s, 120);
    pm.recordFailure(s, 'timeout');
    const stats = pm.getStats();
    expect(Object.keys(stats).length).toBeGreaterThan(0);
    const st = stats[s.proxy!];
    expect(st.totalRequests).toBe(2);
    expect(st.successes).toBe(1);
    expect(st.failures).toBe(1);
  });
});
