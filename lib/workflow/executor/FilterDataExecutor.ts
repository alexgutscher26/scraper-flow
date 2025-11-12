import { ExecutionEnvironment } from "@/types/executor";
import { FilterDataTask } from "../task/FilterData";

export async function FilterDataExecutor(
  environment: ExecutionEnvironment<typeof FilterDataTask>
): Promise<boolean> {
  const data = environment.getInput("data") || "[]";
  const query = environment.getInput("query") || "";

  environment.log.info(`Filtering data with query: "${query}"`);

  if (!data) {
    environment.log.error("Error: Input data is missing.");
    return false;
  }

  try {
    const jsonData = JSON.parse(data);

    if (!Array.isArray(jsonData)) {
      environment.log.error("Error: Input data is not a valid JSON array.");
      return false;
    }

    const lowerCaseQuery = query.toLowerCase();

    const filteredData = jsonData.filter((item: any) => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      return Object.values(item).some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerCaseQuery);
        }
        return false;
      });
    });

    environment.log.info(`Found ${filteredData.length} matching items.`);

    environment.setOutput("filteredData", JSON.stringify(filteredData));

    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    environment.log.error(`Error filtering data: ${errorMessage}`);
    if (error instanceof SyntaxError) {
      environment.log.error(
        "Detailed error: The provided data is not a valid JSON string."
      );
    }
    return false;
  }
}

