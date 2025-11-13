import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import { SelectExecutor } from "@/lib/workflow/executor/SelectExecutor";

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

describe("SelectExecutor", () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
  });

  it("selects native select", async () => {
    await page.setContent(`<select id='s'><option value='a'>A</option><option value='b'>B</option></select>`);
    const inputs = { "Selector": "#s", "Mode": "single", "Values": "b" };
    const e = env(page, inputs);
    const ok = await SelectExecutor(e);
    expect(ok).toBe(true);
    const v = await page.$eval("#s", (el: any) => el.value);
    expect(v).toBe("b");
  });

  it("selects custom dropdown via click", async () => {
    await page.setContent(`
      <div id='dd'>
        <div id='trigger'>open</div>
        <div class='opt'>Alpha</div>
        <div class='opt'>Beta</div>
      </div>
    `);
    const inputs = { "Selector": "#dd", "Mode": "single", "Values": "Beta", "OpenTriggerSelector": "#trigger", "OptionSelector": ".opt" };
    const e = env(page, inputs);
    const ok = await SelectExecutor(e);
    expect(ok).toBe(true);
  });
});

