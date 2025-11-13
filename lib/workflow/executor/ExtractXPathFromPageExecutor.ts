import { ExecutionEnvironment } from "@/types/executor";
import { ExtractXPathFromPageTask } from "../task/ExtractXPathFromPage";
import type { Page } from "puppeteer";

const xpathCache: WeakMap<any, Map<string, any>> = new WeakMap();

export async function ExtractXPathFromPageExecutor(
  environment: ExecutionEnvironment<typeof ExtractXPathFromPageTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error("Web page not found");
      return false;
    }
    const xpath = environment.getInput("XPath");
    const attr = environment.getInput("Attribute") || "textContent";
    const allFlag = environment.getInput("All elements") === "true";

    if (!xpath) {
      environment.log.error("XPath not found");
      return false;
    }

    const cacheKey = `${xpath}|${attr}|${allFlag}`;
    let cache = xpathCache.get(page as Page);
    if (!cache) {
      cache = new Map<string, any>();
      xpathCache.set(page as Page, cache);
    }
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      environment.setOutput("Extracted data", JSON.stringify(cached));
      environment.setOutput("Web page", page);
      return true;
    }

    const result = await page.evaluate(({ xpath, attr, allFlag }) => {
      const getVal = (el: Element | null) => {
        if (!el) return null;
        switch (attr) {
          case "innerText":
            return (el as HTMLElement).innerText ?? null;
          case "value":
            return (el as any).value ?? null;
          case "href":
            return (el as HTMLAnchorElement).href ?? null;
          case "src":
            return (el as HTMLImageElement).src ?? null;
          case "html":
            return (el as HTMLElement).innerHTML ?? null;
          default:
            return el.textContent ?? null;
        }
      };
      const doc = document;
      const snap = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      if (allFlag) {
        const out: any[] = [];
        for (let i = 0; i < snap.snapshotLength; i++) {
          out.push(getVal(snap.snapshotItem(i)));
        }
        return out.filter((v) => v !== null);
      }
      return getVal(snap.snapshotItem(0));
    }, { xpath, attr, allFlag });

    cache.set(cacheKey, result);
    environment.setOutput("Extracted data", JSON.stringify(result));
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
