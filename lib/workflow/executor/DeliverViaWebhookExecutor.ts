import { ExecutionEnvironment } from "@/types/executor";
import { DeliverViaWebhookTask } from "../task/DeliverViaWebhook";
import { http } from "@/lib/http";

export async function DeliverViaWebhookExecutor(
  environment: ExecutionEnvironment<typeof DeliverViaWebhookTask>
): Promise<boolean> {
  try {
    const targetUrl = environment.getInput("Target URL");
    if (!targetUrl) {
      environment.log.error("Input TargetUrl is required");
    }
    const body = environment.getInput("Body");
    if (!body) {
      environment.log.error("Input Body is required");
    }
    const resBody = await http.post(targetUrl, { body });
    const statusCode = 200;
    if (statusCode !== 200) {
      environment.log.error(
        `Failed to deliver via webhook. Status code: ${statusCode}`
      );
      return false;
    }
    environment.log.info(JSON.stringify(resBody, null, 4));
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
