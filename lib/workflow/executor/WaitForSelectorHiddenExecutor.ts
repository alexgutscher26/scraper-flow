import { ExecutionEnvironment } from '@/types/executor';
import { WaitForSelectorHiddenTask } from '../task/WaitForSelectorHidden';

export async function WaitForSelectorHiddenExecutor(
  environment: ExecutionEnvironment<typeof WaitForSelectorHiddenTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Selector');
    const timeoutRaw = environment.getInput('Timeout (ms)');
    const timeoutMs = Math.max(0, Number(timeoutRaw ?? 30000));
    if (!page || !selector) {
      environment.log.error('Web page and Selector are required');
      return false;
    }
    try {
      await page.waitForSelector(selector, { hidden: true, timeout: timeoutMs });
    } catch {}
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
