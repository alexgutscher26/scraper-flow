import { ExecutionEnvironment } from "@/types/executor";
import { TakeScreenshotTask } from "../task/TakeScreenshot";

/**
 * Executes the TakeScreenshot task which captures a screenshot of the current page.
 *
 * Features:
 * - Can capture full page or just the visible area
 * - Supports quality settings for JPEG format
 * - Allows naming the screenshot for reference in other tasks
 * - Returns a base64-encoded image that can be used in other tasks or delivered via webhook
 *
 * @param environment The execution environment with task inputs and outputs
 * @returns Promise resolving to boolean indicating success or failure
 */
export async function TakeScreenshotExecutor(
  environment: ExecutionEnvironment<typeof TakeScreenshotTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    if (!page) {
      environment.log.error("No page found");
      return false;
    }

    const fullPage = environment.getInput("Full page") === "true";
    const screenshotName =
      environment.getInput("Screenshot name") || "screenshot";
    const quality = parseInt(environment.getInput("Quality") || "0", 10);

    // Prepare screenshot options
    const screenshotOptions: any = {
      fullPage,
      encoding: "base64",
    };

    // Add quality option if specified and it's a valid number
    if (quality > 0) {
      screenshotOptions.quality = quality;
      screenshotOptions.type = "jpeg"; // Use JPEG format when quality is specified
      environment.log.info(`Taking screenshot with quality: ${quality}%`);
    }

    // Take screenshot and encode as base64
    environment.log.info(
      `Taking ${fullPage ? "full page" : "visible area"} screenshot...`
    );
    const screenshot = await page.screenshot(screenshotOptions); // Determine image format for the data URL
    const imageFormat = quality > 0 ? "jpeg" : "png";
    const dataUrl = `data:image/${imageFormat};base64,${screenshot}`;

    // Set output as base64 string with proper format
    environment.setOutput("Screenshot", dataUrl);

    // Add screenshot name to output for possible usage in other tasks
    environment.setOutput("Screenshot name", screenshotName);

    // Add download URL (same as the data URL for direct downloading)
    environment.setOutput("Download URL", dataUrl);

    // Pass the browser instance through
    environment.setOutput("Web page", environment.getInput("Web page"));

    environment.log.info(
      `Screenshot "${screenshotName}" captured successfully`
    );
    return true;
  } catch (e: any) {
    environment.log.error(`Screenshot capture failed: ${e.message}`);
    return false;
  }
}
