import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import { ExtractXPathFromPageExecutor } from "@/lib/workflow/executor/ExtractXPathFromPageExecutor";

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

describe("ExtractXPathFromPageExecutor", () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
  });

  it("extracts innerText via XPath", async () => {
    await page.setContent(`<div><span id='x'>Hello</span></div>`);
    const inputs = { "XPath": "//*[@id='x']", "Attribute": "innerText", "All elements": "false" };
    const e = env(page, inputs);
    const ok = await ExtractXPathFromPageExecutor(e);
    expect(ok).toBe(true);
    const data = JSON.parse(e.outputs["Extracted data"]);
    expect(data).toBe("Hello");
  });
});

