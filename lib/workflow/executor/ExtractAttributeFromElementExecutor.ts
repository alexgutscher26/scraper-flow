import { ExecutionEnvironment } from "@/types/executor";
import { ExtractAttributeFromElementTask } from "../task/ExtractAttributeFromElement";

export async function ExtractAttributeFromElementExecutor(
  environment: ExecutionEnvironment<typeof ExtractAttributeFromElementTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const selector = environment.getInput("Selector");
    const attr = environment.getInput("Attribute name");
    if (!page || !selector || !attr) {
      environment.log.error("Web page, Selector, and Attribute name are required");
      return false;
    }
    const value = await page.evaluate(({ selector, attr }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      return (el as any).getAttribute(attr);
    }, { selector, attr });
    environment.setOutput("Value", value ?? "");
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

