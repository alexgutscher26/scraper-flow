import { ExecutionEnvironment } from "@/types/executor";
import { DragAndDropTask } from "../task/DragAndDrop";

/**
 * Executes a drag-and-drop action on a web page.
 *
 * The function retrieves the source and target selectors from the environment, checks their validity,
 * and performs the drag-and-drop operation using the mouse API. It logs errors for any missing elements
 * or issues during the operation and returns a boolean indicating success or failure.
 *
 * @param environment - The execution environment containing methods to interact with the page and log errors.
 * @returns A promise that resolves to a boolean indicating the success of the drag-and-drop operation.
 */
export async function DragAndDropExecutor(
  environment: ExecutionEnvironment<typeof DragAndDropTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const src = environment.getInput("Source selector");
    const dst = environment.getInput("Target selector");
    if (!page || !src || !dst) {
      environment.log.error("Web page, Source selector, and Target selector are required");
      return false;
    }
    const srcHandle = await page.$(src);
    const dstHandle = await page.$(dst);
    if (!srcHandle || !dstHandle) {
      environment.log.error("Source or target element not found");
      return false;
    }
    const srcBox = await srcHandle.boundingBox();
    const dstBox = await dstHandle.boundingBox();
    if (!srcBox || !dstBox) {
      environment.log.error("Unable to compute element bounds");
      return false;
    }
    await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2, { steps: 20 });
    await page.mouse.up();
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

