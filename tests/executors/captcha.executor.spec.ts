import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import puppeteer from "puppeteer";
import { CaptchaExecutor } from "@/lib/workflow/executor/CaptchaExecutor";

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

describe("CaptchaExecutor", () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    // Mock fetch for verification endpoints
    vi.stubGlobal("fetch", vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      } as any;
    }));
  });
  afterAll(async () => {
    await browser.close();
    (global as any).fetch = undefined;
  });

  it("detects reCAPTCHA and verifies token", async () => {
    await page.setContent(`<div class='g-recaptcha' data-sitekey='SITEKEY'></div><textarea id='g-recaptcha-response'>tok123</textarea>`);
    const inputs = { "Web page": page, "SecurityLevel": "medium", "CaptchaType": "auto", "CaptchaCredential": JSON.stringify({ apiKey: "secret" }) };
    const e = env(page, inputs);
    const ok = await CaptchaExecutor(e);
    expect(ok).toBe(true);
    expect(e.outputs.Provider).toBe("recaptcha");
    expect(e.outputs.VerificationPassed).toBe(true);
  });

  it("detects hCaptcha and verifies token", async () => {
    await page.setContent(`<div class='h-captcha' data-sitekey='HSITE'></div><textarea name='h-captcha-response'>tok456</textarea>`);
    const inputs = { "Web page": page, "CaptchaCredential": JSON.stringify({ apiKey: "secret" }) };
    const e = env(page, inputs);
    const ok = await CaptchaExecutor(e);
    expect(ok).toBe(true);
    expect(e.outputs.Provider).toBe("hcaptcha");
    expect(e.outputs.VerificationPassed).toBe(true);
  });
});

