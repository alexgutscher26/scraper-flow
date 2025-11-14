import { createLogger } from '@/lib/log';

export type ConcurrencyConfig = {
  maxConcurrentBrowsers: number;
  maxConcurrentPages: number;
  maxQueueSize?: number;
  queueStrategy?: 'block' | 'fail';
};

type WorkerType = 'browser' | 'page';

class BoundedSemaphore {
  max: number;
  private current: number;
  private queue: Array<() => void>;
  private maxQueueSize: number;
  private strategy: 'block' | 'fail';
  constructor(max: number, maxQueueSize = Infinity, strategy: 'block' | 'fail' = 'block') {
    this.max = Math.max(1, max);
    this.current = 0;
    this.queue = [];
    this.maxQueueSize = maxQueueSize === undefined ? Infinity : Math.max(0, maxQueueSize);
    this.strategy = strategy;
  }
  async acquire(): Promise<{ waitedMs: number }>{
    const start = Date.now();
    if (this.current < this.max) {
      this.current++;
      return { waitedMs: 0 };
    }
    if (this.strategy === 'fail' && this.maxQueueSize === 0 && this.current >= this.max) {
      const err: any = new Error('BACKPRESSURE: queue capacity exceeded');
      err.code = 'BACKPRESSURE';
      throw err;
    }
    if (this.queue.length >= this.maxQueueSize) {
      if (this.strategy === 'fail') {
        const err: any = new Error('BACKPRESSURE: queue capacity exceeded');
        err.code = 'BACKPRESSURE';
        throw err;
      }
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.current++;
    return { waitedMs: Date.now() - start };
  }
  release() {
    this.current = Math.max(0, this.current - 1);
    const next = this.queue.shift();
    if (next) next();
  }
  getStats() {
    return { inFlight: this.current, queued: this.queue.length, capacity: this.max };
  }
}

export type WorkerMetrics = {
  type: WorkerType;
  started: number;
  completed: number;
  failed: number;
  backpressureRejected: number;
  totalWaitMs: number;
  totalRunMs: number;
  peakInFlight: number;
};

/**
 * WorkerPool manages executor concurrency for browser and page tasks.
 *
 * Configuration options:
 * - maxConcurrentBrowsers: maximum simultaneous browser-level tasks
 * - maxConcurrentPages: maximum simultaneous page-level tasks
 * - maxQueueSize: maximum queued tasks awaiting a slot (per type)
 * - queueStrategy: 'block' to wait, 'fail' to reject when queue is full
 *
 * Usage example:
 * const pool = new WorkerPool({ maxConcurrentBrowsers: 2, maxConcurrentPages: 4 });
 * await pool.runBrowser(async () => launchBrowser());
 * await pool.runPage(async () => navigateAndScrape());
 *
 * Metrics interpretation:
 * - started/completed/failed: counts per worker type
 * - backpressureRejected: number of tasks rejected due to queue limits
 * - totalWaitMs: cumulative waiting time due to backpressure
 * - totalRunMs: cumulative execution time inside a worker slot
 * - peakInFlight: highest observed concurrent in-flight tasks
 */
export class WorkerPool {
  private browsers: BoundedSemaphore;
  private pages: BoundedSemaphore;
  private metrics: Record<WorkerType, WorkerMetrics>;
  private logger = createLogger('workflow/workerPool');
  constructor(cfg: ConcurrencyConfig) {
    this.browsers = new BoundedSemaphore(
      cfg.maxConcurrentBrowsers,
      cfg.maxQueueSize,
      cfg.queueStrategy || 'block'
    );
    this.pages = new BoundedSemaphore(
      cfg.maxConcurrentPages,
      cfg.maxQueueSize,
      cfg.queueStrategy || 'block'
    );
    this.metrics = {
      browser: {
        type: 'browser',
        started: 0,
        completed: 0,
        failed: 0,
        backpressureRejected: 0,
        totalWaitMs: 0,
        totalRunMs: 0,
        peakInFlight: 0,
      },
      page: {
        type: 'page',
        started: 0,
        completed: 0,
        failed: 0,
        backpressureRejected: 0,
        totalWaitMs: 0,
        totalRunMs: 0,
        peakInFlight: 0,
      },
    };
  }

  getMaxTotalConcurrency() {
    return Math.max(1, this.browsers.max + this.pages.max);
  }

  async runBrowser<T>(fn: () => Promise<T>): Promise<T> {
    return this.runWith('browser', fn);
  }

  async runPage<T>(fn: () => Promise<T>): Promise<T> {
    return this.runWith('page', fn);
  }

  private async runWith<T>(type: WorkerType, fn: () => Promise<T>): Promise<T> {
    const sem = type === 'browser' ? this.browsers : this.pages;
    const m = this.metrics[type];
    let waitedMs = 0;
    try {
      const statsBefore = sem.getStats();
      m.peakInFlight = Math.max(m.peakInFlight, statsBefore.inFlight);
      const acquired = await sem.acquire();
      waitedMs = acquired.waitedMs;
      m.totalWaitMs += waitedMs;
      m.started++;
    } catch (err: any) {
      if (err?.code === 'BACKPRESSURE') {
        m.backpressureRejected++;
      }
      this.logger.warn(`${type} worker rejected: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
    const start = Date.now();
    try {
      const res = await fn();
      m.completed++;
      return res;
    } catch (e) {
      m.failed++;
      throw e;
    } finally {
      m.totalRunMs += Date.now() - start;
      const statsAfter = sem.getStats();
      m.peakInFlight = Math.max(m.peakInFlight, statsAfter.inFlight);
      sem.release();
    }
  }

  getMetricsSnapshot(): { browser: WorkerMetrics; page: WorkerMetrics } {
    const browserStats = this.browsers.getStats();
    const pageStats = this.pages.getStats();
    const browser = { ...this.metrics.browser };
    const page = { ...this.metrics.page };
    browser.peakInFlight = Math.max(browser.peakInFlight, browserStats.inFlight);
    page.peakInFlight = Math.max(page.peakInFlight, pageStats.inFlight);
    return { browser, page };
  }
}

export const defaultConcurrencyConfig = (): ConcurrencyConfig => ({
  maxConcurrentBrowsers: 2,
  maxConcurrentPages: 4,
  maxQueueSize: 100,
  queueStrategy: 'block',
});
