import { ExecutionEnvironment } from '@/types/executor';
import { ClickElementTask } from '../task/ClickElement';
import { computeDelayMs, sleep } from '@/lib/politeness/delay';

export async function ClickElementExecutor(
  environment: ExecutionEnvironment<typeof ClickElementTask>
): Promise<boolean> {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('Input Selector is required');
    }

    const cfg = environment.getPolitenessConfig?.();
    const st = environment.getPolitenessState?.();
    if (cfg && cfg.delays.enabled) {
      const ms = computeDelayMs(cfg);
      environment.log.info(`Politeness delay: ${ms}ms`);
      await sleep(ms);
    }
    await environment.getPage()!.click(selector);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
