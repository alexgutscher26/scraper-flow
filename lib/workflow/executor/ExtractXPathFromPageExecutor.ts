import { ExecutionEnvironment } from '@/types/executor';
import { ExtractXPathFromPageTask } from '../task/ExtractXPathFromPage';
import type { Page } from 'puppeteer';

const xpathCache: WeakMap<any, Map<string, any>> = new WeakMap();

/**
 * Extracts data from a web page using a specified XPath expression.
 *
 * The function retrieves the web page from the execution environment and checks for the presence of the XPath and attribute inputs.
 * It utilizes caching to avoid redundant evaluations and executes the XPath against the page's document to extract the desired data.
 * The results are then stored in the environment's output. If any errors occur during execution, they are logged.
 *
 * @param environment - The execution environment containing the page and input parameters.
 * @returns A promise that resolves to a boolean indicating the success of the extraction process.
 */
export async function ExtractXPathFromPageExecutor(
  environment: ExecutionEnvironment<typeof ExtractXPathFromPageTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('Web page not found');
      return false;
    }
    const xpath = environment.getInput('XPath');
    const attr = environment.getInput('Attribute') || 'textContent';
    const allFlag = environment.getInput('All elements') === 'true';

    if (!xpath) {
      environment.log.error('XPath not found');
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
      environment.setOutput('Extracted data', JSON.stringify(cached));
      environment.setOutput('Web page', page);
      return true;
    }

    const result = await page.evaluate(
      ({ xpath, attr, allFlag }) => {
        /**
         * Retrieve the value of a specified attribute from a given HTML element.
         *
         * The function checks if the element is null and returns null if it is. It then uses a switch statement to determine which attribute to retrieve based on the provided `attr` value. Depending on the attribute, it casts the element to the appropriate type and returns the corresponding value or null if the attribute is not present.
         *
         * @param el - The HTML element from which to retrieve the attribute value.
         * @returns The value of the specified attribute or null if the element is null or the attribute is not present.
         */
        const getVal = (el: Element | null) => {
          if (!el) return null;
          switch (attr) {
            case 'innerText':
              return (el as HTMLElement).innerText ?? null;
            case 'value':
              return (el as any).value ?? null;
            case 'href':
              return (el as HTMLAnchorElement).href ?? null;
            case 'src':
              return (el as HTMLImageElement).src ?? null;
            case 'html':
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
      },
      { xpath, attr, allFlag }
    );

    cache.set(cacheKey, result);
    environment.setOutput('Extracted data', JSON.stringify(result));
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
