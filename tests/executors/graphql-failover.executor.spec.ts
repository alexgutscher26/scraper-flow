import { describe, it, expect, vi } from 'vitest';
import { GraphQLQueryExecutor } from '@/lib/workflow/executor/GraphQLQueryExecutor';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { ProxyManager } from '@/lib/network/proxyManager';

function env(endpoint: string) {
  const net: any = { config: { proxy: { failoverEnabled: true } } };
  net.proxy = new ProxyManager({
    enabled: true,
    rotateStrategy: 'perRequest',
    providers: [{ name: 'p', proxies: ['http://p1', 'http://p2'] }],
    healthCheckUrl: 'https://example.com',
    failoverEnabled: true,
  });
  const log = { info: vi.fn(), error: vi.fn(), warning: vi.fn() } as any;
  return {
    getInput: (n: string) =>
      ({
        'Endpoint URL': endpoint,
        Query: 'query { ok }',
        'Variables JSON': '{}',
        'Use browser context': 'false',
      })[n],
    setOutput: vi.fn(),
    getPage: () => undefined,
    getPolitenessConfig: () => undefined,
    getPolitenessState: () => undefined,
    getNetwork: () => net,
    log,
  } as any;
}

describe('GraphQL executor failover', () => {
  it('retries with new proxy on error', async () => {
    const calls: any[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: any, init: any) => {
      calls.push({ input, init });
      if (calls.length === 1) throw new Error('proxy error');
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ ok: true }),
      } as any;
    }) as any;
    const ok = await GraphQLQueryExecutor(env('https://api.example/graphql'));
    globalThis.fetch = originalFetch;
    expect(ok).toBe(true);
  });
});
