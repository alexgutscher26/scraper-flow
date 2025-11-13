import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import { TypeInputTask } from "@/lib/workflow/task/TypeInput";
import { TypeInputExecutor } from "@/lib/workflow/executor/TypeInputExecutor";

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

describe("TypeInputExecutor", () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
  });

  it("types value with debounce and validation", async () => {
    await page.setContent(`<input id='x' type='text' maxlength='100'>`);
    const inputs = {
      "Selector": "#x",
      "Value": "hello world",
      "Type": "text",
      "DebounceMs": 30,
      "ClearBeforeType": true,
    };
    const e = env(page, inputs);
    const ok = await TypeInputExecutor(e);
    expect(ok).toBe(true);
    const v = await page.$eval("#x", (el: any) => el.value);
    expect(v).toBe("hello world");
  });
});

