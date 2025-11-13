import { ExecutionEnvironment } from "@/types/executor";
import { InterceptNetworkTask } from "../task/InterceptNetwork";

export async function InterceptNetworkExecutor(
  environment: ExecutionEnvironment<typeof InterceptNetworkTask>
): Promise<boolean> {
  const page = environment.getPage();
  if (!page) {
    environment.log.error("Web page not found");
    return false;
  }

  try {
    const urlPattern = environment.getInput("URL pattern");
    const resourceType = environment.getInput("Resource type") || "any";
    const method = environment.getInput("Method") || "ANY";
    const duration = Number(environment.getInput("Duration (ms)"));
    const max = Number(environment.getInput("Max responses")) || Infinity;
    const includeBody = environment.getInput("Include body") === "true";

    const matches: any[] = [];
    const isRegex = urlPattern && /^\/.+\/$/.test(urlPattern);
    const regex = isRegex ? new RegExp(urlPattern.slice(1, -1)) : null;

    const seen = new Set<string>();
    const pushItem = (item: any) => {
      const key = `${item.method}|${item.url}|${item.status}`;
      if (seen.has(key)) return;
      seen.add(key);
      matches.push(item);
      if (matches.length >= max) {
        page.off("response", handlerResponse);
        page.off("requestfinished", handlerFinished);
      }
    };

    const handlerResponse = async (response: any) => {
      try {
        const req = response.request();
        const url = response.url();
        const type = req.resourceType();
        const m = (req.method && req.method()) || "GET";

        if (resourceType !== "any" && type !== resourceType) return;
        if (method !== "ANY" && m !== method) return;
        if (urlPattern) {
          if (regex) {
            if (!regex.test(url)) return;
          } else {
            if (!url.includes(urlPattern)) return;
          }
        }

        const item: any = {
          url,
          status: response.status(),
          resourceType: type,
          method: m,
          headers: response.headers(),
        };

        if (includeBody) {
          const ct = (await response.headers())["content-type"] || "";
          try {
            if (ct.includes("application/json")) {
              item.body = await response.json();
            } else {
              item.body = await response.text();
            }
          } catch (_) {
            item.body = null;
          }
        }

        try {
          const pd = req.postData && req.postData();
          item.postData = pd || null;
        } catch (_) {
          item.postData = null;
        }

        pushItem(item);
      } catch (err: any) {
        environment.log.warning(err?.message);
      }
    };

    const handlerFinished = async (request: any) => {
      try {
        const url = request.url();
        const type = request.resourceType();
        const m = (request.method && request.method()) || "GET";
        if (resourceType !== "any" && type !== resourceType) return;
        if (method !== "ANY" && m !== method) return;
        if (urlPattern) {
          if (regex) {
            if (!regex.test(url)) return;
          } else {
            if (!url.includes(urlPattern)) return;
          }
        }
        const resp = request.response();
        if (!resp) return;
        const item: any = {
          url,
          status: resp.status(),
          resourceType: type,
          method: m,
          headers: resp.headers(),
        };
        if (includeBody) {
          const ct = resp.headers()["content-type"] || "";
          try {
            if (ct.includes("application/json")) {
              item.body = await resp.json();
            } else {
              item.body = await resp.text();
            }
          } catch (_) {
            item.body = null;
          }
        }
        try {
          const pd = request.postData && request.postData();
          item.postData = pd || null;
        } catch (_) {
          item.postData = null;
        }
        pushItem(item);
      } catch (err: any) {
        environment.log.warning(err?.message);
      }
    };

    page.on("response", handlerResponse);
    page.on("requestfinished", handlerFinished);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        page.off("response", handlerResponse);
        page.off("requestfinished", handlerFinished);
        resolve();
      }, Number.isFinite(duration) ? duration : 2000);
    });

    environment.setOutput("Responses JSON", JSON.stringify(matches));
    environment.setOutput("Web page", page);
    return true;
  } catch (e: any) {
    try {
      page.off("response", () => {});
    } catch {}
    environment.log.error(e.message);
    return false;
  }
}
