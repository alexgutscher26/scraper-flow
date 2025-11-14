import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';
import puppeteer from 'puppeteer';
import { LaunchBrowserExecutor } from '../../lib/workflow/executor/LaunchBrowserExecutor';

function makeEnv(initial: { browser?: any; page?: any; url: string }) {
  const outputs: Record<string, any> = {};
  const logs: string[] = [];
  const log = {
    info: (m: string) => logs.push(m),
    error: (m: string) => logs.push(m),
    warning: (m?: string) => logs.push(String(m ?? '')),
    getAll: () => logs.map((message) => ({ message, level: 'info' })),
  } as any;
  let browser = initial.browser;
  let page = initial.page;
  return {
    getInput: (_: any) => initial.url,
    setOutput: (_: any, v: any) => (outputs['Web page'] = v),
    getBrowser: () => browser,
    setBrowser: (b: any) => (browser = b),
    getPage: () => page,
    setPage: (p: any) => (page = p),
    log,
    getPolitenessConfig: () => undefined,
    getPolitenessState: () => undefined,
    getNetwork: () => undefined,
    outputs,
    logs,
  } as any;
}

describe('LaunchBrowserExecutor optimizations', () => {
  let server: any;
  let port: number;
  let browser: any;
  let page: any;
  let hitCounts: Record<string, number>;

  beforeAll(async () => {
    hitCounts = { '/img.png': 0, '/font.woff2': 0, '/ads/tracker.js': 0 };
    server = http.createServer((req, res) => {
      if (req.url === '/index.html') {
        res.setHeader('content-type', 'text/html');
        res.end(
          `<!doctype html><html><head>
           <link rel="preload" as="font" href="/font.woff2" type="font/woff2" crossorigin>
           <script src="/ads/tracker.js"></script>
           </head><body>
           <img src="/img.png" />
           ready
           </body></html>`
        );
      } else if (req.url === '/img.png') {
        hitCounts['/img.png'] += 1;
        res.setHeader('content-type', 'image/png');
        res.end(Buffer.from([137, 80, 78, 71]));
      } else if (req.url === '/font.woff2') {
        hitCounts['/font.woff2'] += 1;
        res.setHeader('content-type', 'font/woff2');
        res.end(Buffer.alloc(32));
      } else if (req.url === '/ads/tracker.js') {
        hitCounts['/ads/tracker.js'] += 1;
        res.setHeader('content-type', 'application/javascript');
        res.end('console.log("ads")');
      } else {
        res.setHeader('content-type', 'text/plain');
        res.end('ok');
      }
    });
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    port = (server.address() as any).port;
    browser = await puppeteer.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.RESOURCE_BLOCK_ENABLE;
    delete process.env.RESOURCE_BLOCK_IMAGES;
    delete process.env.RESOURCE_BLOCK_FONTS;
    delete process.env.RESOURCE_BLOCK_ADS;
    delete process.env.RESOURCE_BLOCK_AD_PATTERNS;
  });

  afterEach(async () => {
    try {
      if (page && !(page as any).isClosed?.()) await page.close();
    } catch {}
  });

  it('reuses existing browser and page when available', async () => {
    page = await browser.newPage();
    const env = makeEnv({ browser, page, url: `http://localhost:${port}/index.html` });
    const spy = vi.spyOn(puppeteer, 'launch');
    const ok = await LaunchBrowserExecutor(env);
    expect(ok).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    const logs = env.logs.join('\n');
    expect(logs).toMatch(/Browser reused/);
  }, 15000);

  it('does not block resources when disabled', async () => {
    process.env.RESOURCE_BLOCK_ENABLE = 'false';
    hitCounts['/img.png'] = 0;
    hitCounts['/font.woff2'] = 0;
    hitCounts['/ads/tracker.js'] = 0;
    page = await browser.newPage();
    const env = makeEnv({ browser, page, url: `http://localhost:${port}/index.html` });
    const ok = await LaunchBrowserExecutor(env);
    expect(ok).toBe(true);
    expect(hitCounts['/img.png']).toBeGreaterThanOrEqual(1);
    expect(hitCounts['/font.woff2']).toBeGreaterThanOrEqual(1);
    expect(hitCounts['/ads/tracker.js']).toBeGreaterThanOrEqual(1);
    const logs = env.logs.join('\n');
    expect(logs).toMatch(/RESOURCE_BLOCKING_METRIC:/);
    expect(logs).toMatch(/PERF_METRIC:/);
  }, 15000);

  it('blocks images, fonts and ads when enabled and reports metrics', async () => {
    process.env.RESOURCE_BLOCK_ENABLE = 'true';
    process.env.RESOURCE_BLOCK_IMAGES = 'true';
    process.env.RESOURCE_BLOCK_FONTS = 'true';
    process.env.RESOURCE_BLOCK_ADS = 'true';
    process.env.RESOURCE_BLOCK_AD_PATTERNS = 'ads';
    hitCounts['/img.png'] = 0;
    hitCounts['/font.woff2'] = 0;
    hitCounts['/ads/tracker.js'] = 0;
    page = await browser.newPage();
    const env = makeEnv({ browser, page, url: `http://localhost:${port}/index.html` });
    const ok = await LaunchBrowserExecutor(env);
    expect(ok).toBe(true);
    expect(hitCounts['/img.png']).toBe(0);
    expect(hitCounts['/font.woff2']).toBe(0);
    expect(hitCounts['/ads/tracker.js']).toBe(0);
    const logs = env.logs.join('\n');
    const metricLine = logs.split('\n').find((l) => l.includes('RESOURCE_BLOCKING_METRIC:')) || '';
    expect(metricLine).toMatch(/blockedImages=\d+/);
    expect(metricLine).toMatch(/blockedFonts=\d+/);
    expect(metricLine).toMatch(/blockedAds=\d+/);
  }, 15000);

  it('generates a simple performance comparison report between baseline and optimized runs', async () => {
    process.env.RESOURCE_BLOCK_ENABLE = 'false';
    page = await browser.newPage();
    const env1 = makeEnv({ browser, page, url: `http://localhost:${port}/index.html` });
    await LaunchBrowserExecutor(env1);
    const baseline = Number(
      (env1.logs.find((l: string) => l.includes('PERF_METRIC:')) || '').split('domContentLoadedMs=')[1]
    );
    process.env.RESOURCE_BLOCK_ENABLE = 'true';
    process.env.RESOURCE_BLOCK_IMAGES = 'true';
    process.env.RESOURCE_BLOCK_FONTS = 'true';
    process.env.RESOURCE_BLOCK_ADS = 'true';
    process.env.RESOURCE_BLOCK_AD_PATTERNS = 'ads';
    page = await browser.newPage();
    const env2 = makeEnv({ browser, page, url: `http://localhost:${port}/index.html` });
    await LaunchBrowserExecutor(env2);
    const optimized = Number(
      (env2.logs.find((l: string) => l.includes('PERF_METRIC:')) || '').split('domContentLoadedMs=')[1]
    );
    const report = `PERF_COMPARISON: baselineMs=${baseline} optimizedMs=${optimized}`;
    expect(report).toMatch(/baselineMs=\d+/);
    expect(report).toMatch(/optimizedMs=\d+/);
  }, 20000);
});
