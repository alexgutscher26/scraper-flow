import { ExecutionEnvironment } from "@/types/executor";
import { DataTransformTask } from "../task/DataTransform";

export async function DataTransformExecutor(
  environment: ExecutionEnvironment<typeof DataTransformTask>
): Promise<boolean> {
  try {
    const inputText = environment.getInput("Input data");
    const operation = environment.getInput("Transform type");

    if (!inputText || !operation) {
      environment.log.error("Input data and transform type are required");
      return false;
    }

    let result = inputText;

    environment.log.info(`Applying ${operation} transformation to data`);

    switch (operation) {
      case "uppercase":
        result = result.toUpperCase();
        break;
      case "lowercase":
        result = result.toLowerCase();
        break;
      case "trim":
        result = result.trim();
        break;
      case "replace":
        const findText = environment.getInput("Find text");
        const replaceWith = environment.getInput("Replace with");
        if (!findText) {
          environment.log.error("Find text is required for replace operation");
          return false;
        }
        result = result.replace(new RegExp(findText, "g"), replaceWith || "");
        break;
      case "extract_numbers":
        const numbers = result.match(/\d+/g);
        result = numbers ? numbers.join(", ") : "";
        break;
      case "extract_emails":
        const emails = result.match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
        );
        result = emails ? emails.join(", ") : "";
        break;
      case "extract_urls":
        const urls = result.match(
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
        );
        result = urls ? urls.join(", ") : "";
        break;
      case "json_pretty":
        try {
          const parsed = JSON.parse(result);
          result = JSON.stringify(parsed, null, 2);
        } catch (e) {
          environment.log.error("Invalid JSON for formatting");
          return false;
        }
        break;
      case "base64_encode":
        result = Buffer.from(result, "utf8").toString("base64");
        break;
      case "base64_decode":
        try {
          result = Buffer.from(result, "base64").toString("utf8");
        } catch (e) {
          environment.log.error("Invalid base64 string for decoding");
          return false;
        }
        break;
      default:
        environment.log.error(`Unknown operation: ${operation}`);
        return false;
    }

    environment.setOutput("Transformed data", result);
    environment.log.info(`Transformation completed successfully`);

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to transform data: ${e.message}`);
    return false;
  }
}
