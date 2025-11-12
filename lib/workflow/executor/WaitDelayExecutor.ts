import { ExecutionEnvironment } from "@/types/executor";
import { WaitDelayTask } from "../task/WaitDelay";

export async function WaitDelayExecutor(
  environment: ExecutionEnvironment<typeof WaitDelayTask>
): Promise<boolean> {
  try {
    const seconds = environment.getInput("Delay (seconds)");
    if (!seconds) {
      environment.log.error("Input Delay (seconds) is required");
      return false;
    }

    const numericSeconds = Number(seconds);
    if (isNaN(numericSeconds) || numericSeconds < 0) {
      environment.log.error("Seconds must be a valid non-negative number");
      return false;
    }

    environment.log.info(`Starting delay for ${numericSeconds} seconds`);

    await new Promise((resolve) => setTimeout(resolve, numericSeconds * 1000));

    environment.log.info(`Delay completed: waited ${numericSeconds} seconds`);
    return true;
  } catch (e: any) {
    environment.log.error(`Failed to execute delay: ${e.message}`);
    return false;
  }
}
