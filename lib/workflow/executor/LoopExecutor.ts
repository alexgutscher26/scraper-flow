import { ExecutionEnvironment } from "@/types/executor";
import { LoopTask } from "../task/Loop";

export async function LoopExecutor(
  environment: ExecutionEnvironment<typeof LoopTask>
): Promise<boolean> {
  try {
    const arrayData = environment.getInput("Array data");
    if (!arrayData) {
      environment.log.error("Array data is required");
      return false;
    }

    let parsedArray: any[];

    try {
      // Try to parse as JSON array
      parsedArray = JSON.parse(arrayData);

      if (!Array.isArray(parsedArray)) {
        environment.log.error("Input must be a valid JSON array");
        return false;
      }
    } catch (e) {
      // If JSON parsing fails, try to split as string
      if (typeof arrayData === "string") {
        parsedArray = arrayData.split(",").map((item) => item.trim());
      } else {
        environment.log.error("Invalid array data format");
        return false;
      }
    }

    environment.log.info(
      `Starting loop iteration over ${parsedArray.length} items`
    );

    const results: any[] = [];

    for (let i = 0; i < parsedArray.length; i++) {
      const currentItem = parsedArray[i];

      environment.log.info(
        `Processing item ${i + 1}/${parsedArray.length}: ${JSON.stringify(
          currentItem
        )}`
      ); // Set outputs for current iteration
      environment.setOutput(
        "Current item",
        typeof currentItem === "object"
          ? JSON.stringify(currentItem)
          : String(currentItem)
      );
      environment.setOutput("Current index", i.toString());
      environment.setOutput(
        "Is last",
        (i === parsedArray.length - 1).toString()
      );

      // Store current item for downstream tasks
      results.push({
        item: currentItem,
        index: i,
        isFirst: i === 0,
        isLast: i === parsedArray.length - 1,
      });
    }

    environment.log.info(
      `Loop completed successfully. Processed ${parsedArray.length} items`
    );

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to execute loop: ${e.message}`);
    return false;
  }
}
