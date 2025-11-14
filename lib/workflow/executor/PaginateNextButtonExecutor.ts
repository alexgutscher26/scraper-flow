import { ExecutionEnvironment } from '@/types/executor';
import { PaginateNextButtonTask } from '../task/PaginateNextButton';

export async function PaginateNextButtonExecutor(
  environment: ExecutionEnvironment<typeof PaginateNextButtonTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Next selector');
    const maxRaw = environment.getInput('Max pages');
    const delayRaw = environment.getInput('Delay (ms)');
    if (!page || !selector) {
      environment.log.error('Web page and Next selector are required');
      return false;
    }
    const maxPages = Math.max(1, Number(maxRaw ?? 5));
    const delayMs = Math.max(0, Number(delayRaw ?? 1000));
    for (let i = 0; i < maxPages; i++) {
      const exists = await page.$(selector);
      if (!exists) break;
      await page.click(selector);
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
