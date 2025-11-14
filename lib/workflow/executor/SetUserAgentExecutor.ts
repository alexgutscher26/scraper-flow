import { ExecutionEnvironment } from '@/types/executor';
import { SetUserAgentTask } from '../task/SetUserAgent';
import { applyHeaders } from '@/lib/politeness/userAgent';

export async function SetUserAgentExecutor(
  environment: ExecutionEnvironment<typeof SetUserAgentTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error('No browser page available');
      return false;
    }

    const ua = environment.getInput('User agent');
    const randomizeAL = environment.getInput('Randomize accept-language');

    if (ua && ua.trim().length > 0) {
      await page.setUserAgent(ua.trim());
      if (String(randomizeAL).toLowerCase() === 'true') {
        // Minimal randomization: reuse politeness helper with current config/state
        const cfg = environment.getPolitenessConfig();
        const state = environment.getPolitenessState();
        if (cfg && state) {
          // apply only headers using existing helper
          await applyHeaders(
            page as any,
            { ...cfg, userAgent: { ...cfg.userAgent, enabled: true } },
            state
          );
        }
      }
      environment.log.info('User agent set explicitly');
    } else {
      const cfg = environment.getPolitenessConfig();
      const state = environment.getPolitenessState();
      if (!cfg || !state) {
        environment.log.error('Politeness configuration not available to rotate user agent');
        return false;
      }
      await applyHeaders(page as any, cfg, state);
      environment.log.info('User agent applied via politeness rotation');
    }

    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
