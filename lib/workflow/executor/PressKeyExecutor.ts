import { ExecutionEnvironment } from '@/types/executor';
import { PressKeyTask } from '../task/PressKey';

export async function PressKeyExecutor(
  environment: ExecutionEnvironment<typeof PressKeyTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const key = environment.getInput('Key');
    if (!page || !key) {
      environment.log.error('Web page and Key are required');
      return false;
    }
    await (page as any).keyboard.press(key as any);
    environment.setOutput('Web page', page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
