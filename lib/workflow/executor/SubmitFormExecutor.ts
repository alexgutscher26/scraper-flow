import { ExecutionEnvironment } from '@/types/executor';
import { SubmitFormTask } from '../task/SubmitForm';

export async function SubmitFormExecutor(
  environment: ExecutionEnvironment<typeof SubmitFormTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput('Form selector');
    const waitNav = environment.getInput('Wait for navigation') === 'true';
    const timeoutRaw = environment.getInput('Timeout (ms)');
    const timeoutMs = Math.max(0, Number(timeoutRaw ?? 30000));
    if (!page || !selector) {
      environment.log.error('Web page and Form selector are required');
      return false;
    }
    const existed = await (page as any).$(selector);
    if (!existed) {
      environment.log.error('Form element not found');
      return false;
    }
    await (page as any).evaluate((sel: string) => {
      const form = document.querySelector(sel) as HTMLFormElement | null;
      form?.requestSubmit();
    }, selector);
    if (waitNav) {
      try {
        await (page as any).waitForNavigation({ timeout: timeoutMs, waitUntil: 'networkidle0' });
      } catch {}
    }
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
