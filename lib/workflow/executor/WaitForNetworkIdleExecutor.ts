import { ExecutionEnvironment } from '@/types/executor';
import { WaitForNetworkIdleTask } from '../task/WaitForNetworkIdle';

export async function WaitForNetworkIdleExecutor(
  environment: ExecutionEnvironment<typeof WaitForNetworkIdleTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No browser page available');
      return false;
    }

    const idleRaw = environment.getInput('Idle threshold (ms)');
    const timeoutRaw = environment.getInput('Timeout (ms)');
    const idleMs = Math.max(0, Number(idleRaw ?? 1000));
    const timeoutMs = Math.max(0, Number(timeoutRaw ?? 30000));

    let inflight = 0;
    let lastChange = Date.now();
    const onReq = () => {
      inflight++;
      lastChange = Date.now();
    };
    const onDone = () => {
      inflight = Math.max(0, inflight - 1);
      lastChange = Date.now();
    };
    page.on('request', onReq);
    page.on('requestfinished', onDone as any);
    page.on('requestfailed', onDone as any);

    const start = Date.now();
    try {
      while (true) {
        const now = Date.now();
        if (inflight === 0 && now - lastChange >= idleMs) break;
        if (now - start > timeoutMs) throw new Error('Timed out waiting for network idle');
        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      page.off('request', onReq);
      page.off('requestfinished', onDone as any);
      page.off('requestfailed', onDone as any);
    }

    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
