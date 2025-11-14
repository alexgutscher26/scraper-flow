import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import http from 'http';
import { InterceptNetworkExecutor } from '@/lib/workflow/executor/InterceptNetworkExecutor';

function env(page: any, inputs: Record<string, any>) {
  const outputs: Record<string, any> = {};
  const log = {
    info: (_: string) => {},
    error: (_: string) => {},
    warning: (_?: string) => {},
    getAll: () => [],
  } as any;
  return {
    getInput: (n: any) => inputs[n],
    setOutput: (n: any, v: any) => (outputs[n] = v),
    getPage: () => page,
    setPage: (_: any) => {},
    getBrowser: () => undefined,
    setBrowser: (_: any) => {},
    log,
    getPolitenessConfig: () => undefined,
    getPolitenessState: () => undefined,
    outputs,
  } as any;
}

describe('InterceptNetworkExecutor', () => {
  let browser: any;
  let page: any;
  let server: any;
  let port: number;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, echo: body.length }));
        });
      } else {
        res.setHeader('content-type', 'text/plain');
        res.end('ok');
      }
    });
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    port = (server.address() as any).port;
  });
  afterAll(async () => {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('captures POST JSON responses', async () => {
    await page.setContent(`<div>ready</div>`);
    const inputs = {
      'URL pattern': `/api/`,
      'Resource type': 'document',
      Method: 'GET',
      'Duration (ms)': 800,
      'Max responses': 10,
      'Include body': 'true',
    };
    const e = env(page, inputs);
    const run = InterceptNetworkExecutor(e);
    await page.goto(`http://localhost:${port}/api`);
    const ok = await run;
    expect(ok).toBe(true);
    const data = JSON.parse(e.outputs['Responses JSON']);
    expect(Array.isArray(data)).toBe(true);
  });
});
