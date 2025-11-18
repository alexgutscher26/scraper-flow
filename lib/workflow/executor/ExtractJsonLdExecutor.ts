import { ExecutionEnvironment } from '@/types/executor';
import { ExtractJsonLdTask } from '../task/ExtractJsonLd';

export async function ExtractJsonLdExecutor(
  environment: ExecutionEnvironment<typeof ExtractJsonLdTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No browser page available');
      return false;
    }
    const data = await (page as any).evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const arr: any[] = [];
      for (const s of scripts) {
        try {
          const obj = JSON.parse(s.textContent || '{}');
          arr.push(obj);
        } catch {}
      }
      return arr.length === 1 ? arr[0] : arr;
    });
    environment.setOutput('Json', data);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
