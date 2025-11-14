import type { Dispatcher } from "undici";
import { ProxyAgent } from "undici";
import { NetworkConfig, ProxyStats, ProxySelection } from "@/types/network";

type Provider = {
  name: string;
  proxies: string[];
  auth?: Record<string, { username: string; password: string }>;
};

export class ProxyManager {
  private providers: Provider[] = [];
  private stats = new Map<string, ProxyStats>();
  private healthCheckUrl: string;
  private rotateStrategy: NonNullable<NetworkConfig["proxy"]>["rotateStrategy"];
  private currentByDomain = new Map<string, string>();
  private currentSessionProxy?: string;
  private lock: Promise<void> = Promise.resolve();
  private failoverEnabled: boolean = false;
  private unavailable = new Map<string, number>();

  constructor(cfg: NetworkConfig["proxy"] | undefined) {
    this.providers = (cfg?.providers || []).map(p => ({ name: p.name, proxies: p.proxies, auth: p.auth }));
    this.healthCheckUrl = cfg?.healthCheckUrl || "https://example.com";
    this.rotateStrategy = cfg?.rotateStrategy || "perSession";
    this.failoverEnabled = !!cfg?.failoverEnabled;
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = (async () => { try { return await fn(); } finally {} })();
    this.lock = next.then(() => undefined);
    return next;
  }

  /**
   * Retrieves a flat array of all proxies from the providers.
   */
  private allProxies(): string[] {
    return this.providers.flatMap(p => p.proxies);
  }

  /**
   * Selects a random proxy from the available proxies, excluding specified ones.
   */
  private pickNext(exclude: Set<string> = new Set()): string | undefined {
    const now = Date.now();
    const pool = this.allProxies().filter(p => !exclude.has(p) && (!this.failoverEnabled || ((this.unavailable.get(p) || 0) < now)));
    if (!pool.length) return undefined;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Retrieves authentication credentials for a specified proxy.
   *
   * The function iterates through the available providers and checks if
   * authentication information exists for the given proxy. If found, it
   * returns the corresponding credentials; otherwise, it returns undefined.
   *
   * @param proxy - The identifier for the proxy to retrieve authentication for.
   */
  private getAuth(proxy: string): { username: string; password: string } | undefined {
    for (const p of this.providers) {
      const a = p.auth?.[proxy];
      if (a) return a;
    }
    return undefined;
  }

  /**
   * Selects a proxy based on the provided URL and rotation strategy.
   *
   * This function constructs a URL object to extract the domain and then attempts to select a proxy
   * based on the defined rotation strategy. It first checks if a proxy is already selected for the domain,
   * then checks for a session-specific proxy, and finally picks the next available proxy if none are found.
   * The selected proxy is stored according to the rotation strategy, and authentication details are retrieved
   * before returning the result.
   *
   * @param url - The URL for which a proxy needs to be selected.
   */
  async select(url: string): Promise<ProxySelection> {
    const u = new URL(url);
    const domain = u.hostname;
    return this.withLock(async () => {
      let selected: string | undefined;
      if (this.rotateStrategy === "perDomain") selected = this.currentByDomain.get(domain);
      if (!selected && this.rotateStrategy === "perSession") selected = this.currentSessionProxy;
      if (!selected) selected = this.pickNext();
      if (!selected) return { url };
      const auth = this.getAuth(selected);
      if (this.rotateStrategy === "perDomain") this.currentByDomain.set(domain, selected);
      if (this.rotateStrategy === "perSession") this.currentSessionProxy = selected;
      const skipValidation = (this.rotateStrategy === "perDomain" && !!this.currentByDomain.get(domain)) || (this.rotateStrategy === "perSession" && !!this.currentSessionProxy)
      if (this.failoverEnabled && !skipValidation) {
        let attempts = 0;
        while (attempts < 3) {
          const ok = await this.validate({ url, proxy: selected, auth });
          if (ok) break;
          this.unavailable.set(selected, Date.now() + 60_000);
          const next = this.pickNext(new Set([selected]));
          if (!next) break;
          selected = next;
          attempts++;
        }
      }
      return { url, proxy: selected, auth };
    });
  }

  dispatcherFor(selection: ProxySelection): Dispatcher | undefined {
    if (!selection.proxy) return undefined;
    try {
      const u = new URL(selection.proxy);
      if (selection.auth) { u.username = selection.auth.username; u.password = selection.auth.password; }
      return new ProxyAgent(u.toString());
    } catch {
      return new ProxyAgent(selection.proxy);
    }
  }

  /**
   * Records a successful request for a given proxy selection.
   *
   * This function updates the statistics for the specified proxy by incrementing the total request count and the success count.
   * It also calculates the average latency, applying a weighted average with a factor of 0.9 for the previous average and 0.1 for the new latency.
   * If the proxy is not defined in the selection, the function exits early without making any updates.
   *
   * @param selection - The proxy selection object containing the proxy to be updated.
   * @param latencyMs - The latency in milliseconds for the successful request.
   */
  recordSuccess(selection: ProxySelection, latencyMs: number): void {
    if (!selection.proxy) return;
    const s = this.stats.get(selection.proxy) || { totalRequests: 0, successes: 0, failures: 0 };
    s.totalRequests += 1;
    s.successes += 1;
    s.avgLatencyMs = s.avgLatencyMs == null ? latencyMs : Math.round((s.avgLatencyMs * 0.9) + (latencyMs * 0.1));
    this.stats.set(selection.proxy, s);
  }

  /**
   * Records a failure for the given proxy selection and error message.
   */
  recordFailure(selection: ProxySelection, error: string): void {
    if (!selection.proxy) return;
    const s = this.stats.get(selection.proxy) || { totalRequests: 0, successes: 0, failures: 0 };
    s.totalRequests += 1;
    s.failures += 1;
    s.lastError = error;
    this.stats.set(selection.proxy, s);
    if (this.failoverEnabled) this.unavailable.set(selection.proxy, Date.now() + 60_000);
  }

  getStats(): Record<string, ProxyStats> {
    const out: Record<string, ProxyStats> = {};
    for (const [k, v] of this.stats) out[k] = v;
    return out;
  }

  /**
   * Validates the given proxy selection by checking its health status.
   *
   * This function first checks if the selection has a proxy. If not, it returns true immediately.
   * If a proxy is present, it attempts to fetch the health check URL using a HEAD request with the appropriate dispatcher.
   * The function returns true if the response is successful (res.ok), and false if any error occurs during the fetch operation.
   *
   * @param selection - The ProxySelection object containing the proxy information to validate.
   */
  async validate(selection: ProxySelection): Promise<boolean> {
    if (!selection.proxy) return true;
    try {
      const dispatcher = this.dispatcherFor(selection);
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(this.healthCheckUrl, { method: "HEAD", cache: "no-cache", dispatcher: dispatcher as any, signal: controller.signal as any });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }
}
