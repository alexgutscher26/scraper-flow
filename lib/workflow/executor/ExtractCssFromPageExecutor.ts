import { ExecutionEnvironment } from '@/types/executor';
import { ExtractCssFromPageTask } from '../task/ExtractCssFromPage';
import type { Page } from 'puppeteer';

const pageCache: WeakMap<any, Map<string, any>> = new WeakMap();

/**
 * Extract CSS or attribute values from a web page based on a given selector.
 *
 * The function retrieves the page from the execution environment and checks for the presence of the selector and attribute.
 * It utilizes caching to avoid redundant extractions and evaluates the page to extract the desired values.
 * If no data is found, it logs a warning. In case of errors, it logs the error message and returns false.
 *
 * @param environment - The execution environment containing the page and input parameters.
 * @returns A promise that resolves to true if data extraction is successful, otherwise false.
 */
export async function ExtractCssFromPageExecutor(
  environment: ExecutionEnvironment<typeof ExtractCssFromPageTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('Web page not found');
      return false;
    }
    const selector = environment.getInput('Selector');
    const attr = environment.getInput('Attribute') || 'textContent';
    const allFlag = environment.getInput('All elements') === 'true';

    if (!selector) {
      environment.log.error('Selector not found');
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
      environment.setOutput('Extracted data', JSON.stringify(cached));
      environment.setOutput('Web page', page);
      return true;
    }

    await page.waitForSelector(selector, { timeout: 15000 });
    const result = await page.evaluate(
      ({ selector, attr, allFlag }) => {
        const els = Array.from(document.querySelectorAll(selector));
        /**
         * Retrieve the value of a specified attribute from a given HTML element.
         *
         * The function checks the attribute type and returns the corresponding value from the element.
         * It handles various cases such as "innerText", "value", "href", "src", and "html",
         * defaulting to the text content if the attribute does not match any case.
         *
         * @param el - The HTML element from which to retrieve the attribute value.
         * @returns The value of the specified attribute or null if not applicable.
         */
        const getVal = (el: Element) => {
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
        if (allFlag) {
          return els.map(getVal).filter((v) => v !== null);
        }
        const first = els[0];
        return first ? getVal(first) : null;
      },
      { selector, attr, allFlag }
    );

    if (result == null || (Array.isArray(result) && result.length === 0)) {
      environment.log.warning('No data extracted for selector');
    }

    cache.set(cacheKey, result);
    environment.setOutput('Extracted data', JSON.stringify(result));
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
