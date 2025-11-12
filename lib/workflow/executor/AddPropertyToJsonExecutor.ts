import { ExecutionEnvironment } from "@/types/executor";
import { AddPropertyToJsonTask } from "../task/AddPropertyToJson";

export async function AddPropertyToJsonExecutor(
  environment: ExecutionEnvironment<typeof AddPropertyToJsonTask>
): Promise<boolean> {
  try {
    const jsonData = environment.getInput("JSON");
    if (!jsonData) {
      environment.log.error("Input JSON is required");
      return false;
    }

    const propertyName = environment.getInput("Property name");
    if (!propertyName) {
      environment.log.error("Input Property name is required");
      return false;
    }

    const propertyValue = environment.getInput("Property value");
    if (!propertyValue) {
      environment.log.error("Input Property value is required");
      return false;
    }

    let json;
    try {
      json = JSON.parse(jsonData);
    } catch (parseError) {
      environment.log.error(`Invalid JSON format: ${parseError}`);
      return false;
    }

    // Ensure the parsed value is an object
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      environment.log.error("JSON must be a valid object");
      return false;
    }

    // Add the property
    json[propertyName] = propertyValue;

    const updatedJson = JSON.stringify(json, null, 2);
    environment.setOutput("Updated JSON", updatedJson);

    environment.log.info(
      `Successfully added property "${propertyName}" to JSON`
    );
    return true;
  } catch (e: any) {
    environment.log.error(`Failed to add property to JSON: ${e.message}`);
    return false;
  }
}
