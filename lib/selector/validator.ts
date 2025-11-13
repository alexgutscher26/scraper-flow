import * as cheerio from "cheerio";
import { CandidateSelector, ValidationResult } from "./types";

export function validateAgainstHtml(html: string, candidate: CandidateSelector): ValidationResult {
  try {
    const $ = cheerio.load(html);
    let matched = 0;
    if (candidate.type === "css") {
      matched = $(candidate.selector).length;
    } else {
      const sel = candidate.selector.replace(/^\/\//, "");
      matched = $(sel).length;
    }
    const valid = matched > 0;
    return { selector: candidate, valid, matched };
  } catch (e: any) {
    return { selector: candidate, valid: false, matched: 0, error: e.message };
  }
}

export async function validateAgainstPage(page: any, candidate: CandidateSelector): Promise<ValidationResult> {
  try {
    const start = performance.now();
    const matched = await page.evaluate((c) => {
      if (c.type === "css") {
        return document.querySelectorAll(c.selector).length;
      }
      const res = document.evaluate(c.selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      return res.snapshotLength;
    }, { selector: candidate.selector, type: candidate.type });
    const latency = performance.now() - start;
    const valid = matched > 0;
    return { selector: { ...candidate, metrics: { ...candidate.metrics, latencyMs: latency } }, valid, matched };
  } catch (e: any) {
    return { selector: candidate, valid: false, matched: 0, error: e.message };
  }
}
