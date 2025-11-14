export class Semaphore {
  max: number;
  private current: number;
  private queue: Array<() => void>;
  constructor(max: number) {
    this.max = Math.max(1, max);
    this.current = 0;
    this.queue = [];
  }
  /**
   * Increments the current count or adds a resolver to the queue if the max is reached.
   */
  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.current++;
  }
  release() {
    this.current = Math.max(0, this.current - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}

export async function runConcurrentWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing = new Set<Promise<void>>();
  const n = Math.max(1, limit);
  for (let i = 0; i < tasks.length; i++) {
    if (executing.size >= n) {
      await Promise.race(executing);
    }
    const p = tasks[i]()
      .then((res) => {
        results[i] = res as any;
      })
      .finally(() => {
        executing.delete(p);
      });
    executing.add(p);
  }
  await Promise.all([...executing]);
  return results;
}
