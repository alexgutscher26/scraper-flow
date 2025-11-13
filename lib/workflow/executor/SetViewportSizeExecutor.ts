import { ExecutionEnvironment } from "@/types/executor";
import { SetViewportSizeTask } from "../task/SetViewportSize";

export async function SetViewportSizeExecutor(
  environment: ExecutionEnvironment<typeof SetViewportSizeTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const wRaw = environment.getInput("Width");
    const hRaw = environment.getInput("Height");
    const dprRaw = environment.getInput("Device scale factor");
    if (!page || !wRaw || !hRaw) {
      environment.log.error("Web page, Width, and Height are required");
      return false;
    }
    const width = Number(wRaw);
    const height = Number(hRaw);
    const dpr = dprRaw ? Number(dprRaw) : undefined;
    await page.setViewport({ width, height, deviceScaleFactor: dpr });
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

