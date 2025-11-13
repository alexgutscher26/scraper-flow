import { ExecutionEnvironment } from "@/types/executor";
import { DoubleClickElementTask } from "../task/DoubleClickElement";

export async function DoubleClickElementExecutor(
  environment: ExecutionEnvironment<typeof DoubleClickElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput("Selector");
    if (!page || !selector) {
      environment.log.error("Web page and Selector are required");
      return false;
    }
    await page.click(selector, { clickCount: 2 });
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

