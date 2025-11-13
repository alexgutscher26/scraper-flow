import { ExecutionEnvironment } from "@/types/executor";
import { SetExtraHeadersTask } from "../task/SetExtraHeaders";

export async function SetExtraHeadersExecutor(
  environment: ExecutionEnvironment<typeof SetExtraHeadersTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const headersRaw = environment.getInput("Headers JSON");
    if (!page || !headersRaw) {
      environment.log.error("Web page and Headers JSON are required");
      return false;
    }
    let headers: Record<string, string> = {};
    try { headers = JSON.parse(headersRaw); } catch { environment.log.error("Invalid Headers JSON"); return false; }
    await page.setExtraHTTPHeaders(headers);
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

