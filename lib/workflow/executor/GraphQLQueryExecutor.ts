import { ExecutionEnvironment } from "@/types/executor";
import { GraphQLQueryTask } from "../task/GraphQLQuery";
import { applyHeaders } from "@/lib/politeness/userAgent";
import { http } from "@/lib/http";
import { ProxyManager } from "@/lib/network/proxyManager";

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
      const net = environment.getNetwork?.();
      const proxyMgr = net?.proxy as ProxyManager | undefined;
      const session = net?.session as any | undefined;
      if (session?.isExpired?.()) session.renew?.();
      let selection = proxyMgr ? await proxyMgr.select(endpoint) : { url: endpoint };
      const dispatcher = proxyMgr ? proxyMgr.dispatcherFor(selection) : undefined;
      try {
        const data = await http.post(endpoint, {
          headers: { "content-type": "application/json" },
          body: { query, variables },
          dispatcher: dispatcher as any,
          cookieJar: session,
        });
        environment.setOutput("Response JSON", JSON.stringify(data));
        if (page) environment.setOutput("Web page", page);
        proxyMgr?.recordSuccess(selection, 0);
        return true;
      } catch (e: any) {
        proxyMgr?.recordFailure(selection, e.message || String(e));
        environment.log.error(e.message);
        return false;
      }
    }
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
