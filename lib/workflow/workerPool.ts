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
  /**
   * Acquire a resource, managing backpressure and queueing as necessary.
   *
   * The function checks if the current resource count is below the maximum allowed. If so, it increments the count and returns immediately.
   * If the strategy is set to 'fail' and the queue is full, it throws an error indicating backpressure. If the queue is not full, it waits for a promise to resolve before incrementing the count and returning the time waited.
   *
   * @returns An object containing the time waited in milliseconds.
   * @throws Error If the queue capacity is exceeded and the strategy is 'fail'.
   */
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
  /**
   * Decrements the current index and executes the next function in the queue, if available.
   */
  release() {
    this.current = Math.max(0, this.current - 1);
    const next = this.queue.shift();
    if (next) next();
  }
  /**
   * Retrieves the current statistics of the system.
   */
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

  /**
   * Returns the maximum total concurrency based on the maximum browsers and pages.
   */
  getMaxTotalConcurrency() {
    return Math.max(1, this.browsers.max + this.pages.max);
  }

  /**
   * Executes a function in the browser context and returns its result.
   */
  async runBrowser<T>(fn: () => Promise<T>): Promise<T> {
    return this.runWith('browser', fn);
  }

  /**
   * Executes a given asynchronous function within a page context.
   */
  async runPage<T>(fn: () => Promise<T>): Promise<T> {
    return this.runWith('page', fn);
  }

  /**
   * Executes a given asynchronous function within a specified worker type context.
   *
   * The function first acquires a semaphore based on the worker type, updating metrics for in-flight tasks and wait times. It then executes the provided function, handling any errors that may occur during execution. Finally, it updates the metrics and releases the semaphore, ensuring that the peak in-flight tasks are tracked correctly.
   *
   * @param type - The type of worker to use, either 'browser' or 'page'.
   * @param fn - An asynchronous function that returns a Promise of type T.
   * @returns A Promise that resolves to the result of the executed function.
   * @throws Error If the function execution fails or if semaphore acquisition is rejected due to backpressure.
   */
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

  /**
   * Retrieves the current metrics snapshot for the browser and page.
   */
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

/**
 * Returns the default concurrency configuration.
 */
export const defaultConcurrencyConfig = (): ConcurrencyConfig => ({
  maxConcurrentBrowsers: 2,
  maxConcurrentPages: 4,
  maxQueueSize: 100,
  queueStrategy: 'block',
});
