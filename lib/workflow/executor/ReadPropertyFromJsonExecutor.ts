import { ExecutionEnvironment } from "@/types/executor";
import { ReadPropertyFromJsonTask } from "../task/ReadPropertyFromJson";

export async function ReadPropertyFromJsonExecutor(
  environment: ExecutionEnvironment<typeof ReadPropertyFromJsonTask>
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

    let json;
    try {
      json = JSON.parse(jsonData);
    } catch (parseError) {
      environment.log.error(`Invalid JSON format: ${parseError}`);
      return false;
    }

    // Support nested property access using dot notation
    const propertyValue = getNestedProperty(json, propertyName);

    if (propertyValue === undefined) {
      environment.log.error(`Property "${propertyName}" not found in JSON`);
      return false;
    }

    // Convert value to string if it's not already
    const stringValue =
      typeof propertyValue === "string"
        ? propertyValue
        : JSON.stringify(propertyValue);

    environment.setOutput("Property value", stringValue);
    environment.log.info(`Successfully extracted property "${propertyName}"`);

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to read property from JSON: ${e.message}`);
    return false;
  }
}

// Helper function to get nested properties using dot notation
function getNestedProperty(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}
