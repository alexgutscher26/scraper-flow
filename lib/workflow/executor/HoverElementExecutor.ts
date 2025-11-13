import { ExecutionEnvironment } from "@/types/executor";
import { HoverElementTask } from "../task/HoverElement";

export async function HoverElementExecutor(
  environment: ExecutionEnvironment<typeof HoverElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput("Selector");
    if (!page || !selector) {
      environment.log.error("Web page and Selector are required");
      return false;
    }
    await page.hover(selector);
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

