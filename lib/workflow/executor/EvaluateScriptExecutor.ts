import { ExecutionEnvironment } from '@/types/executor';
import { EvaluateScriptTask } from '../task/EvaluateScript';

export async function EvaluateScriptExecutor(
  environment: ExecutionEnvironment<typeof EvaluateScriptTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const script = environment.getInput('Script') || '';
    const returnType = environment.getInput('Return type') || 'json';
    if (!page || !script) {
      environment.log.error('Web page and Script are required');
      return false;
    }
    const result = await (page as any).evaluate(new Function(script) as any);
    let formatted: any = result;
    if (returnType === 'string') formatted = String(result);
    else if (returnType === 'boolean') formatted = Boolean(result);
    else if (returnType === 'json') {
      try {
        formatted = JSON.parse(JSON.stringify(result));
      } catch {
        formatted = result;
      }
    }
    environment.setOutput('Result', formatted);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
