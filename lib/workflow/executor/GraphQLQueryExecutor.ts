import { ExecutionEnvironment } from "@/types/executor";
import { GraphQLQueryTask } from "../task/GraphQLQuery";
import { applyHeaders } from "@/lib/politeness/userAgent";

/**
 * Executes a GraphQL query against a specified endpoint.
 *
 * The function retrieves necessary inputs such as the endpoint URL, query, and variables from the environment.
 * It checks for required parameters and handles both browser and non-browser contexts for executing the query.
 * In case of errors, it logs appropriate messages and returns false, while successful execution returns true.
 *
 * @param environment - The execution environment containing configuration and state for the GraphQL query.
 * @returns A promise that resolves to a boolean indicating the success of the query execution.
 */
export async function GraphQLQueryExecutor(
  environment: ExecutionEnvironment<typeof GraphQLQueryTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const endpoint = environment.getInput("Endpoint URL");
    const query = environment.getInput("Query");
    const varsRaw = environment.getInput("Variables JSON");
    const useBrowser = environment.getInput("Use browser context") === "true";

    if (!endpoint || !query) {
      environment.log.error("Endpoint URL and Query are required");
      return false;
    }

    let variables: any = undefined;
    if (varsRaw) {
      try {
        variables = JSON.parse(varsRaw);
      } catch (e: any) {
        environment.log.warning("Variables JSON is invalid; ignoring");
      }
    }

    const politenessConfig = environment.getPolitenessConfig();
    const politenessState = environment.getPolitenessState();

    if (useBrowser) {
      if (!page || !politenessConfig || !politenessState) {
        environment.log.error("Browser context requires Web page and politeness config/state");
        return false;
      }
      await applyHeaders(page as any, politenessConfig, politenessState, endpoint);
      const data = await page.evaluate(async ({ endpoint, query, variables }) => {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await res.json();
        return await res.text();
      }, { endpoint, query, variables });
      environment.setOutput("Response JSON", JSON.stringify(data));
      environment.setOutput("Web page", page);
      return true;
    } else {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, variables }),
      } as any);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      environment.setOutput("Response JSON", JSON.stringify(data));
      if (page) environment.setOutput("Web page", page);
      return true;
    }
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}

