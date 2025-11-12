import { ExecutionEnvironment } from "@/types/executor";
import { ClickElementTask } from "../task/ClickElement";
import { NavigateUrlTask } from "../task/NavigateUrl";
import { computeDelayMs, sleep } from "@/lib/politeness/delay";
import { applyHeaders } from "@/lib/politeness/userAgent";
import { isAllowed } from "@/lib/politeness/robots";

export async function NavigateUrlExecutor(
  environment: ExecutionEnvironment<typeof NavigateUrlTask>
): Promise<boolean> {
  try {
    const url = environment.getInput("URL");
    if (!url) {
      environment.log.error("Input URL is required");
    }

    const cfg = environment.getPolitenessConfig?.();
    const st = environment.getPolitenessState?.();
    if (cfg && st) {
      if (cfg.delays.enabled) {
        const ms = computeDelayMs(cfg);
        environment.log.info(`Politeness delay: ${ms}ms`);
        await sleep(ms);
      }
      const ua = await applyHeaders(environment.getPage()! as any, cfg, st, url);
      const usedUA = ua || cfg.robots.userAgentOverride || "*";
      const allowed = await isAllowed(url, cfg, st, usedUA);
      if (!allowed) {
        environment.log.warning(`Blocked by robots.txt: ${url}`);
        if (cfg.robots.enforcement === "strict") {
          return false;
        }
      }
    }
    await environment.getPage()!.goto(url);
    environment.log.info(`Visited to ${url}`);
    return true;
  } catch (e: any) {
    environment.log.error(e.message);
    return false;
  }
}
