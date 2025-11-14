import { ExecutionEnvironment } from '@/types/executor';
import { InfiniteScrollTask } from '../task/InfiniteScroll';

export async function InfiniteScrollExecutor(
  environment: ExecutionEnvironment<typeof InfiniteScrollTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No browser page available');
      return false;
    }

    const maxIterationsRaw = environment.getInput('Max iterations');
    const delayRaw = environment.getInput('Delay (ms)');
    const maxIterations = Math.max(1, Number(maxIterationsRaw ?? 5));
    const delayMs = Math.max(0, Number(delayRaw ?? 1000));

    environment.log.info(`Infinite scroll: iterations=${maxIterations}, delayMs=${delayMs}`);

    let lastHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let i = 0; i < maxIterations; i++) {
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' })
      );
      // Wait for content to load
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }

      const newHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      environment.log.info(`Scroll ${i + 1}/${maxIterations}: height=${newHeight}`);
      // Break if no more content loaded
      if (newHeight <= lastHeight) {
        environment.log.info('No additional content detected; stopping early');
        break;
      }
      lastHeight = newHeight;
    }

    // Pass through the page
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
