import { ExecutionEnvironment } from "@/types/executor";
import { ExtractCssFromPageTask } from "../task/ExtractCssFromPage";
import type { Page } from "puppeteer";

const pageCache: WeakMap<any, Map<string, any>> = new WeakMap();

export async function ExtractCssFromPageExecutor(
  environment: ExecutionEnvironment<typeof ExtractCssFromPageTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error("Web page not found");
      return false;
    }
    const selector = environment.getInput("Selector");
    const attr = environment.getInput("Attribute") || "textContent";
    const allFlag = environment.getInput("All elements") === "true";

    if (!selector) {
      environment.log.error("Selector not found");
      return false;
    }

    const cacheKey = `${selector}|${attr}|${allFlag}`;
    let cache = pageCache.get(page as Page);
    if (!cache) {
      cache = new Map<string, any>();
      pageCache.set(page as Page, cache);
    }
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      environment.setOutput("Extracted data", JSON.stringify(cached));
      environment.setOutput("Web page", page);
      return true;
    }

    await page.waitForSelector(selector, { timeout: 15000 });
    const result = await page.evaluate(
      ({ selector, attr, allFlag }) => {
        const els = Array.from(document.querySelectorAll(selector));
        const getVal = (el: Element) => {
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
        if (allFlag) {
          return els.map(getVal).filter((v) => v !== null);
        }
        const first = els[0];
        return first ? getVal(first) : null;
      },
      { selector, attr, allFlag }
    );

    if (result == null || (Array.isArray(result) && result.length === 0)) {
      environment.log.warning("No data extracted for selector");
    }

    cache.set(cacheKey, result);
    environment.setOutput("Extracted data", JSON.stringify(result));
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

