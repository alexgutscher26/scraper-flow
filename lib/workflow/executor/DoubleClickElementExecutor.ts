import { ExecutionEnvironment } from '@/types/executor';
import { DoubleClickElementTask } from '../task/DoubleClickElement';

/**
 * Executes a double-click action on a specified element within a web page.
 *
 * This function retrieves the current page and the selector from the provided environment.
 * It checks for the existence of both before attempting to perform a double-click action.
 * If successful, it logs the page as output; otherwise, it handles errors gracefully.
 *
 * @param environment - The execution environment containing the page and input details.
 */
export async function DoubleClickElementExecutor(
  environment: ExecutionEnvironment<typeof DoubleClickElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Selector');
    if (!page || !selector) {
      environment.log.error('Web page and Selector are required');
      return false;
    }
    await page.click(selector, { clickCount: 2 });
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
