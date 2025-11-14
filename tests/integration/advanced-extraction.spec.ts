import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import http from 'http';
import { InterceptNetworkExecutor } from '@/lib/workflow/executor/InterceptNetworkExecutor';
import { ExtractCssFromPageExecutor } from '@/lib/workflow/executor/ExtractCssFromPageExecutor';

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

describe('Advanced extraction integration', () => {
  let browser: any;
  let page: any;
  let server: any;
  let port: number;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/api') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      } else {
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

  it.skip('intercepts network while extracting CSS', async () => {
    await page.setContent(`<div class='name'>Alpha</div>`);

    const netInputs = {
      'URL pattern': `/api/`,
      'Resource type': 'document',
      Method: 'GET',
      'Duration (ms)': 800,
      'Max responses': 1,
      'Include body': 'true',
    };
    const e1 = env(page, netInputs);
    const netRun = InterceptNetworkExecutor(e1);
    await page.goto(`http://localhost:${port}/api`);
    const netOk = await netRun;
    expect(netOk).toBe(true);
    const responses = JSON.parse(e1.outputs['Responses JSON']);
    expect(Array.isArray(responses)).toBe(true);

    const cssInputs = { Selector: '.name', Attribute: 'textContent', 'All elements': 'false' };
    const e2 = env(page, cssInputs);
    const cssOk = await ExtractCssFromPageExecutor(e2);
    expect(cssOk).toBe(true);
    const name = JSON.parse(e2.outputs['Extracted data']);
    expect(name).toBe('Alpha');
  }, 15000);
});
