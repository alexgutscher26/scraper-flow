export type ProxyConfig = {
  enabled: boolean;
  providers?: Array<{
    name: string;
    proxies: string[];
    auth?: Record<string, { username: string; password: string }>;
  }>;
  rotateStrategy?: 'perSession' | 'perDomain' | 'perRequest';
  healthCheckUrl?: string;
  failoverEnabled?: boolean;
};

export type CookiesConfig = {
  enabled: boolean;
  persist: boolean;
  sessionTtlMs?: number;
};

export type HttpConfig = {
  useCookieJar?: boolean;
};

export type NetworkConfig = {
  proxy?: ProxyConfig;
  cookies?: CookiesConfig;
  http?: HttpConfig;
};

export type ProxyStats = {
  totalRequests: number;
  successes: number;
  failures: number;
  lastError?: string;
  avgLatencyMs?: number;
};

export type ProxySelection = {
  url: string;
  proxy?: string;
  auth?: { username: string; password: string };
};

export type NetworkState = {
  config: NetworkConfig;
  // opaque handles set by managers
  proxy?: any;
  session?: any;
};

export function defaultNetworkConfig(): NetworkConfig {
  const enabled = process.env.NETWORK_PROXY_ENABLED === 'true';
  const rotateStrategy = (process.env.NETWORK_PROXY_ROTATE_STRATEGY as any) || 'perSession';
  const healthCheckUrl = process.env.NETWORK_PROXY_HEALTHCHECK_URL || 'https://example.com';
  const cookiesEnabled = process.env.NETWORK_COOKIES_ENABLED !== 'false';
  const persist = process.env.NETWORK_COOKIES_PERSIST !== 'false';
  const sessionTtlMs = Number(process.env.NETWORK_SESSION_TTL_MS || '1800000');
  const httpUseJar = process.env.NETWORK_HTTP_USE_JAR !== 'false';
  return {
    proxy: {
      enabled,
      rotateStrategy,
      providers: [],
      healthCheckUrl,
      failoverEnabled: true,
    },
    cookies: { enabled: cookiesEnabled, persist, sessionTtlMs },
    http: { useCookieJar: httpUseJar },
  };
}
