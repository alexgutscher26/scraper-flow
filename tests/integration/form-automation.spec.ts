import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import puppeteer from 'puppeteer';
import { UploadExecutor } from '@/lib/workflow/executor/UploadExecutor';
import { CaptchaExecutor } from '@/lib/workflow/executor/CaptchaExecutor';
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
    outputs,
  } as any;
}

describe('Form automation integration', () => {
  let browser: any;
  let page: any;
  let tmp: string;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    tmp = path.join(process.cwd(), 'tests', 'integration', 'tmp.txt');
    fs.writeFileSync(tmp, 'data');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ success: true }),
          }) as any
      )
    );
  });
  afterAll(async () => {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    (global as any).fetch = undefined;
  });

  it('uploads files and verifies captcha', async () => {
    await page.setContent(
      `<form><input id='f' type='file' /><div class='g-recaptcha' data-sitekey='SITEKEY'></div><textarea id='g-recaptcha-response'>tok</textarea></form>`
    );
    const upInputs = { Selector: '#f', Files: tmp };
    const e1 = env(page, upInputs);
    const upOk = await UploadExecutor(e1);
    expect(upOk).toBe(true);
    const capInputs = { 'Web page': page, CaptchaCredential: JSON.stringify({ apiKey: 'secret' }) };
    const e2 = env(page, capInputs);
    const capOk = await CaptchaExecutor(e2);
    expect(capOk).toBe(true);
    expect(e2.outputs.VerificationPassed).toBe(true);
  });
});
