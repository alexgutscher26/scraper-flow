import { describe, it, expect } from 'vitest';
import { runConcurrentWithLimit } from '@/lib/workflow/concurrency';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('runConcurrentWithLimit throughput', () => {
  it('runs tasks concurrently up to limit', async () => {
    const tasks = [
      () => delay(200).then(() => 1),
      () => delay(200).then(() => 2),
      () => delay(200).then(() => 3),
      () => delay(200).then(() => 4),
    ];
    const start = Date.now();
    const results = await runConcurrentWithLimit(tasks, 2);
    const elapsed = Date.now() - start;
    expect(results.length).toBe(4);
    expect(elapsed).toBeLessThan(600);
  }, 5000);
});
