import { ExecutionEnvironment } from "@/types/executor";
import { RestRequestTask } from "../task/RestRequest";
import { applyHeaders } from "@/lib/politeness/userAgent";
import { http } from "@/lib/http";
import { ProxyManager } from "@/lib/network/proxyManager";

export async function RestRequestExecutor(
  environment: ExecutionEnvironment<typeof RestRequestTask>
): Promise<boolean> {
  try {
    const page = environment.getPage();
    const method = environment.getInput("Method");
    const url = environment.getInput("URL");
    const headersRaw = environment.getInput("Headers JSON");
    const bodyRaw = environment.getInput("Body JSON");
    const useBrowser = environment.getInput("Use browser context") === "true";

    if (!method || !url) {
      environment.log.error("Method and URL are required");
      return false;
    }

    let headers: Record<string, string> | undefined;
    let body: any = undefined;
    if (headersRaw) {
      try { headers = JSON.parse(headersRaw); } catch { environment.log.warning("Headers JSON invalid; ignoring"); }
    }
    if (bodyRaw) {
      try { body = JSON.parse(bodyRaw); } catch { environment.log.warning("Body JSON invalid; treating as string"); body = bodyRaw; }
    }

    if (useBrowser) {
      if (!page) {
        environment.log.error("Browser context requires Web page");
        return false;
      }
      const cfg = environment.getPolitenessConfig();
      const state = environment.getPolitenessState();
      if (cfg && state) await applyHeaders(page as any, cfg, state, url);
      const data = await page.evaluate(async ({ url, method, headers, body }) => {
        const init: any = { method, headers: headers || {} };
        if (body != null) init.body = typeof body === "string" ? body : JSON.stringify(body);
        const res = await fetch(url, init);
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) return await res.json();
        return await res.text();
      }, { url, method, headers, body });
      environment.setOutput("Response JSON", JSON.stringify(data));
      environment.setOutput("Web page", page);
      return true;
    } else {
      const net = environment.getNetwork?.();
      const proxyMgr = net?.proxy as ProxyManager | undefined;
      const session = net?.session as any | undefined;
      if (session?.isExpired?.()) session.renew?.();
      let selection = proxyMgr ? await proxyMgr.select(url) : { url };
      const controller = new AbortController();
      try {
        const dispatcher = proxyMgr ? proxyMgr.dispatcherFor(selection) : undefined;
        let result: any;
        if (method === "GET") {
          result = await http.get(url, { headers, dispatcher: dispatcher as any, cookieJar: session, signal: controller.signal, timeoutMs: 30000 });
        } else if (method === "POST") {
          result = await http.post(url, { headers, body, dispatcher: dispatcher as any, cookieJar: session, signal: controller.signal, timeoutMs: 30000 });
        } else {
          result = await http.request(url, { method: method as any, headers, body, dispatcher: dispatcher as any, cookieJar: session, signal: controller.signal, timeoutMs: 30000 } as any);
        }
        environment.setOutput("Response JSON", JSON.stringify(result));
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

