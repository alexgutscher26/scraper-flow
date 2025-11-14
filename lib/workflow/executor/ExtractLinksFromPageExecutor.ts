import { ExecutionEnvironment } from '@/types/executor';
import { ExtractLinksFromPageTask } from '../task/ExtractLinksFromPage';

export async function ExtractLinksFromPageExecutor(
  environment: ExecutionEnvironment<typeof ExtractLinksFromPageTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No browser page available');
      return false;
    }

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'));
      return anchors
        .map((a) => ({ href: a.href, text: a.textContent?.trim() || '' }))
        .filter((l) => !!l.href);
    });

    environment.setOutput('Links', links);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
