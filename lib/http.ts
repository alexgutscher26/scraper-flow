import { emitHttpMetric } from './metrics/http';

type CacheEntry<T> = { value: T; expiresAt: number };

type HttpOptions = {
  ttlMs?: number;
  maxSize?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOnStatuses?: number[];
};

type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache | undefined;
  body?: any;
  dispatcher?: any;
  cookieJar?: {
    attachToRequest(url: string, init: any): void;
    captureFromResponse(url: string, headers: Headers): void;
  };
  timeoutMs?: number;
};

function stableKey(input: string, init?: RequestInit | RequestOptions): string {
  const h = typeof (init as any)?.headers === 'object' ? (init as any).headers : undefined;
  const body = (init as any)?.body;
  const method = (init as any)?.method || 'GET';
  return JSON.stringify({ url: input, method, headers: h, body });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class HttpClient {
  private cache = new Map<string, CacheEntry<any>>();
  private inflight = new Map<string, Promise<any>>();
  private ttlMs: number;
  private maxSize: number;
  private retries: number;
  private retryDelayMs: number;
  private retryOnStatuses: number[];

  constructor(opts: HttpOptions = {}) {
    this.ttlMs = opts.ttlMs ?? 5_000;
    this.maxSize = opts.maxSize ?? 500;
    this.retries = opts.retries ?? 2;
    this.retryDelayMs = opts.retryDelayMs ?? 300;
    this.retryOnStatuses = opts.retryOnStatuses ?? [429, 502, 503, 504];
    setInterval(() => this.sweep(), 30_000).unref?.();
  }

  private sweep() {
    const now = Date.now();
    for (const [k, v] of this.cache) {
      if (v.expiresAt <= now) this.cache.delete(k);
    }
    if (this.cache.size > this.maxSize) {
      const toDelete = this.cache.size - this.maxSize;
      const keys = Array.from(this.cache.keys()).slice(0, toDelete);
      for (const k of keys) this.cache.delete(k);
    }
  }

  async request<T = any>(input: string, init: RequestInit & RequestOptions = {}): Promise<T> {
    const key = stableKey(input, init);
    const now = performance.now?.() ?? Date.now();
    const cacheEntry = this.cache.get(key);
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) return cacheEntry.value as T;
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    /**
     * Fetch data from a given input URL with retry logic and cookie handling.
     *
     * The function attempts to fetch data from the specified input URL, handling retries on failure based on the configured number of retries and delay strategy. It captures metrics for the HTTP request, processes the response based on its content type, and manages cookies if a cookie jar is provided. If the response is not successful and the status code indicates a retryable error, it will retry the request according to the specified parameters.
     *
     * @param input - The URL to fetch data from.
     * @param init - An optional configuration object for the fetch request.
     * @returns The parsed response data of type T.
     * @throws Error If the response is not ok and the status is not retryable, or if the maximum number of retries is exceeded.
     */
    const doFetch = async (): Promise<T> => {
      const method = String((init as any)?.method || 'GET');
      let attempt = 0;
      while (true) {
        const start = performance.now?.() ?? Date.now();
        let response: Response | null = null;
        try {
          let localController: AbortController | undefined;
          let localTimeout: any;
          if (!(init as any).signal && (init as any).timeoutMs && (init as any).timeoutMs! > 0) {
            localController = new AbortController();
            (init as any).signal = localController.signal;
            localTimeout = setTimeout(
              () => {
                localController?.abort();
              },
              (init as any).timeoutMs
            );
          }
          if ((init as any).cookieJar) {
            try {
              (init as any).cookieJar.attachToRequest(input, init);
            } catch {}
          }
          const reqInit: any = { ...init };
          if ((init as any).dispatcher) reqInit.dispatcher = (init as any).dispatcher;
          response = await fetch(input, reqInit as RequestInit);
          if (localTimeout) clearTimeout(localTimeout);
        } catch (err) {
          emitHttpMetric({
            url: input,
            method,
            status: -1,
            durationMs: (performance.now?.() ?? Date.now()) - start,
            timestamp: Date.now(),
          });
          if (attempt < this.retries) {
            const delay = this.retryDelayMs * 2 ** attempt + Math.floor(Math.random() * 50);
            attempt++;
            await sleep(delay);
            continue;
          }
          throw err;
        }

        const duration = (performance.now?.() ?? Date.now()) - start;
        const ct = response.headers.get('content-type') || '';
        const sizeHeader = response.headers.get('content-length');
        emitHttpMetric({
          url: input,
          method,
          status: response.status,
          durationMs: duration,
          sizeBytes: sizeHeader ? Number(sizeHeader) : undefined,
          timestamp: Date.now(),
        });

        let parsed: any;
        if (ct.includes('application/json')) parsed = await response.json();
        else if (ct.includes('text/')) parsed = await response.text();
        else parsed = await response.arrayBuffer();

        if (!response.ok) {
          const shouldRetry = this.retryOnStatuses.includes(response.status);
          if (shouldRetry && attempt < this.retries) {
            const delay = this.retryDelayMs * 2 ** attempt + Math.floor(Math.random() * 50);
            attempt++;
            await sleep(delay);
            continue;
          }
          const error = new Error(`HTTP ${response.status}`);
          (error as any).status = response.status;
          (error as any).body = parsed;
          throw error;
        }

        try {
          (init as any).cookieJar?.captureFromResponse(input, response.headers);
        } catch {}
        this.cache.set(key, { value: parsed, expiresAt: Date.now() + this.ttlMs });
        return parsed as T;
      }
    };

    const promise = doFetch().finally(() => {
      this.inflight.delete(key);
    });
    this.inflight.set(key, promise);
    return promise;
  }

  get<T = any>(url: string, opts: RequestOptions = {}) {
    return this.request<T>(url, { ...opts, method: 'GET' });
  }
  post<T = any>(url: string, opts: RequestOptions = {}) {
    const headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
    const body = opts.body != null ? JSON.stringify(opts.body) : undefined;
    return this.request<T>(url, { ...opts, method: 'POST', headers, body });
  }
}

export const http = new HttpClient();
