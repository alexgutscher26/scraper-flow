import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import { ExtractCssFromPageExecutor } from "@/lib/workflow/executor/ExtractCssFromPageExecutor";

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

describe("ExtractCssFromPageExecutor", () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
  });

  it("extracts text from first element", async () => {
    await page.setContent(`<div class='item'>A</div><div class='item'>B</div>`);
    const inputs = { "Selector": ".item", "Attribute": "textContent", "All elements": "false" };
    const e = env(page, inputs);
    const ok = await ExtractCssFromPageExecutor(e);
    expect(ok).toBe(true);
    const data = JSON.parse(e.outputs["Extracted data"]);
    expect(data).toBe("A");
  });

  it("extracts all hrefs", async () => {
    await page.setContent(`<a href='https://a'>A</a><a href='https://b'>B</a>`);
    const inputs = { "Selector": "a", "Attribute": "href", "All elements": "true" };
    const e = env(page, inputs);
    const ok = await ExtractCssFromPageExecutor(e);
    expect(ok).toBe(true);
    const data = JSON.parse(e.outputs["Extracted data"]);
    expect(data).toEqual(["https://a/", "https://b/"]); // browser normalizes
  });
});

