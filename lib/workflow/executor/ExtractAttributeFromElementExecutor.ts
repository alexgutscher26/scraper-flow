import { ExecutionEnvironment } from '@/types/executor';
import { ExtractAttributeFromElementTask } from '../task/ExtractAttributeFromElement';

/**
 * Extracts a specified attribute value from a DOM element on a web page.
 *
 * The function retrieves the current page and the selector and attribute name from the environment.
 * It checks for the presence of these values, logs an error if any are missing, and attempts to evaluate
 * the attribute value using the page's context. The result is then set as an output in the environment.
 *
 * @param environment - The execution environment containing the page and input parameters.
 * @returns A promise that resolves to true if the attribute was successfully extracted, otherwise false.
 */
export async function ExtractAttributeFromElementExecutor(
  environment: ExecutionEnvironment<typeof ExtractAttributeFromElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Selector');
    const attr = environment.getInput('Attribute name');
    if (!page || !selector || !attr) {
      environment.log.error('Web page, Selector, and Attribute name are required');
      return false;
    }
    const value = await (page as any).evaluate(
      ({ selector, attr }: { selector: string; attr: string }) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        return (el as any).getAttribute(attr);
      },
      { selector, attr }
    );
    environment.setOutput('Value', value ?? '');
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
