import { describe, it, expect } from 'vitest';
import { WorkerPool } from '../../workflow/workerPool';

/**
 * Returns a promise that resolves after a specified delay.
 */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('WorkerPool concurrency', () => {
  it('enforces max concurrent pages', async () => {
    const pool = new WorkerPool({ maxConcurrentBrowsers: 1, maxConcurrentPages: 3 });
    let active = 0;
    let peak = 0;
    const tasks = Array.from({ length: 10 }).map(() =>
      pool.runPage(async () => {
        active++;
        peak = Math.max(peak, active);
        await delay(50);
        active--;
        return true;
      })
    );
    await Promise.allSettled(tasks);
    const metrics = pool.getMetricsSnapshot();
    expect(peak).toBeLessThanOrEqual(3);
    expect(metrics.page.peakInFlight).toBeLessThanOrEqual(3);
    expect(metrics.page.completed).toBe(10);
    expect(metrics.page.backpressureRejected).toBe(0);
  });

  it('applies backpressure with block strategy (wait time increases under load)', async () => {
    const pool = new WorkerPool({
      maxConcurrentBrowsers: 1,
      maxConcurrentPages: 1,
      maxQueueSize: 5,
      queueStrategy: 'block',
    });
    const tasks = Array.from({ length: 10 }).map(() =>
      pool.runPage(async () => {
        await delay(50);
        return true;
      })
    );
    await Promise.all(tasks);
    const metrics = pool.getMetricsSnapshot();
    expect(metrics.page.totalWaitMs).toBeGreaterThan(0);
    expect(metrics.page.completed).toBe(10);
  });

  it('collects run and wait time metrics', async () => {
    const pool = new WorkerPool({ maxConcurrentBrowsers: 1, maxConcurrentPages: 2 });
    const tasks = [
      pool.runPage(async () => {
        await delay(30);
        return true;
      }),
      pool.runPage(async () => {
        await delay(40);
        return true;
      }),
      pool.runPage(async () => {
        await delay(50);
        return true;
      }),
      pool.runBrowser(async () => {
        await delay(20);
        return true;
      }),
    ];
    await Promise.all(tasks);
    const metrics = pool.getMetricsSnapshot();
    expect(metrics.page.completed).toBe(3);
    expect(metrics.browser.completed).toBe(1);
    expect(metrics.page.totalRunMs).toBeGreaterThan(0);
    expect(metrics.page.totalWaitMs).toBeGreaterThanOrEqual(0);
    expect(metrics.browser.totalRunMs).toBeGreaterThan(0);
  });
});
