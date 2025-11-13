import { ExecutionEnvironment } from "@/types/executor";
import { WaitForNavigationTask } from "../task/WaitForNavigation";

export async function WaitForNavigationExecutor(
  environment: ExecutionEnvironment<typeof WaitForNavigationTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const timeoutRaw = environment.getInput("Timeout (ms)");
    const timeoutMs = Math.max(0, Number(timeoutRaw ?? 30000));
    if (!page) {
      environment.log.error("No browser page available");
      return false;
    }
    try { await page.waitForNavigation({ timeout: timeoutMs, waitUntil: "networkidle0" }); } catch {}
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

