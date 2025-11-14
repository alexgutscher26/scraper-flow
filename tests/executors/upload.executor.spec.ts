import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import { UploadExecutor } from '@/lib/workflow/executor/UploadExecutor';
import fs from 'node:fs';
import path from 'node:path';

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

describe('UploadExecutor', () => {
  let browser: any;
  let page: any;
  let tmp: string;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    tmp = path.join(process.cwd(), 'tests', 'executors', 'tmp.txt');
    fs.writeFileSync(tmp, 'data');
  });
  afterAll(async () => {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });

  it('uploads file via input', async () => {
    await page.setContent(`<input id='f' type='file'>`);
    const inputs = { Selector: '#f', Files: tmp };
    const e = env(page, inputs);
    const ok = await UploadExecutor(e);
    expect(ok).toBe(true);
    expect(e.outputs.UploadedCount).toBe(1);
    expect(e.outputs.UploadProgress).toBe(100);
  });

  it('validates type and size with strictMode off (skips invalid)', async () => {
    await page.setContent(`<input id='f' type='file'>`);
    const bad = path.join(process.cwd(), 'tests', 'executors', 'bad.xyz');
    fs.writeFileSync(bad, '1234567890');
    const inputs = {
      Selector: '#f',
      Files: `${tmp},${bad}`,
      AcceptTypes: /\.txt$/.source,
      MaxSizeMB: 0.0001,
      StrictMode: false,
    };
    const e = env(page, inputs);
    const ok = await UploadExecutor(e);
    expect(ok).toBe(true);
    expect(e.outputs.UploadedCount).toBe(1);
    expect(e.outputs.ErrorMessage).toBeTypeOf('string');
    fs.unlinkSync(bad);
  });

  it('fails fast with strictMode on', async () => {
    await page.setContent(`<input id='f' type='file'>`);
    const bad = path.join(process.cwd(), 'tests', 'executors', 'bad.xyz');
    fs.writeFileSync(bad, '1234567890');
    const inputs = {
      Selector: '#f',
      Files: `${tmp},${bad}`,
      AcceptTypes: /\.txt$/.source,
      StrictMode: true,
    };
    const e = env(page, inputs);
    const ok = await UploadExecutor(e);
    expect(ok).toBe(false);
    expect(e.outputs.Success).toBe(false);
    fs.unlinkSync(bad);
  });
});
