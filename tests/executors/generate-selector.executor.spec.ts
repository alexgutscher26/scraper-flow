import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import { GenerateSelectorExecutor } from '@/lib/workflow/executor/GenerateSelectorExecutor';

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

describe('GenerateSelectorExecutor', () => {
  let browser: any;
  let page: any;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
  });

  it('produces primary and fallbacks for target', async () => {
    await page.setContent(`<div><button class='btn primary'>Buy</button></div>`);
    const html = await page.content();
    const inputs = {
      Html: html,
      'Web page': page,
      'Target description': 'Buy',
      Mode: 'strict',
      'Specificity level': 2,
      Strategy: 'both',
    };
    const e = env(page, inputs);
    const ok = await GenerateSelectorExecutor(e);
    expect(ok).toBe(true);
    const primary = JSON.parse(e.outputs['Primary selector']);
    const fallbacks = JSON.parse(e.outputs['Fallback selectors']);
    const report = JSON.parse(e.outputs['Selector report']);
    expect(primary.selector.length).toBeGreaterThan(0);
    expect(Array.isArray(fallbacks)).toBe(true);
    expect(Array.isArray(report.candidates)).toBe(true);
  });
});
