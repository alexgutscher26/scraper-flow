import { ExecutionEnvironment } from '@/types/executor';
import { ExtractHtmlFromElementTask } from '../task/ExtractHtmlFromElement';

export async function ExtractHtmlFromElementExecutor(
  environment: ExecutionEnvironment<typeof ExtractHtmlFromElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Selector');
    if (!page || !selector) {
      environment.log.error('Web page and Selector are required');
      return false;
    }
    const html = await (page as any).$eval(
      selector,
      (el: Element) => (el as HTMLElement).innerHTML
    );
    environment.setOutput('Html', html);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
