import { ExecutionEnvironment } from "@/types/executor";
import { ConditionalLogicTask } from "../task/ConditionalLogic";

export async function ConditionalLogicExecutor(
  environment: ExecutionEnvironment<typeof ConditionalLogicTask>
): Promise<boolean> {
  try {
    const leftValue = environment.getInput("Value 1");
    const operator = environment.getInput("Operator");
    const rightValue = environment.getInput("Value 2");

    if (leftValue === undefined || leftValue === null) {
      environment.log.error("Input Left value is required");
      return false;
    }

    if (!operator) {
      environment.log.error("Input Operator is required");
      return false;
    }

    if (rightValue === undefined || rightValue === null) {
      environment.log.error("Input Right value is required");
      return false;
    }

    environment.log.info(
      `Evaluating condition: "${leftValue}" ${operator} "${rightValue}"`
    );

    let result = false;

    // Convert values to appropriate types for comparison
    const left = parseValue(leftValue);
    const right = parseValue(rightValue);

    switch (operator) {
      case "equals":
        result = left === right;
        break;
      case "not_equals":
        result = left !== right;
        break;
      case "greater_than":
        result = Number(left) > Number(right);
        break;
      case "less_than":
        result = Number(left) < Number(right);
        break;
      case "greater_or_equal":
        result = Number(left) >= Number(right);
        break;
      case "less_or_equal":
        result = Number(left) <= Number(right);
        break;
      case "contains":
        result = String(left)
          .toLowerCase()
          .includes(String(right).toLowerCase());
        break;
      case "starts_with":
        result = String(left)
          .toLowerCase()
          .startsWith(String(right).toLowerCase());
        break;
      case "ends_with":
        result = String(left)
          .toLowerCase()
          .endsWith(String(right).toLowerCase());
        break;
      case "is_empty":
        result = !left || String(left).trim() === "";
        break;
      case "is_not_empty":
        result = !!left && String(left).trim() !== "";
        break;
      default:
        environment.log.error(`Unknown operator: ${operator}`);
        return false;
    }

    environment.setOutput("Result", result);
    environment.log.info(`Condition result: ${result}`);

    return true;
  } catch (e: any) {
    environment.log.error(`Failed to evaluate condition: ${e.message}`);
    return false;
  }
}

function parseValue(value: any): any {
  if (typeof value === "string") {
    // Try to parse as number
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Try to parse as boolean
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;

    // Return as string
    return value;
  }

  return value;
}
