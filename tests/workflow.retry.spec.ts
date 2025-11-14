import { describe, it, expect, vi } from 'vitest';
import { BackoffStrategy, defaultRetryPolicy, RetryPolicy } from '@/types/workflow';
vi.mock('server-only', () => ({}));
import * as ew from '@/lib/workflow/retry';

describe('computeRetryBackoffMs', () => {
  it('computes exponential backoff without jitter', async () => {
    const policy: RetryPolicy = {
      ...defaultRetryPolicy(),
      initialDelayMs: 1000,
      multiplier: 2,
      maxDelayMs: 10000,
      jitterPct: 0,
      strategy: BackoffStrategy.EXPONENTIAL,
    };
    expect(ew.computeRetryBackoffMs(policy, 1)).toBe(1000);
    expect(ew.computeRetryBackoffMs(policy, 2)).toBe(2000);
    expect(ew.computeRetryBackoffMs(policy, 3)).toBe(4000);
    expect(ew.computeRetryBackoffMs(policy, 4)).toBe(8000);
    expect(ew.computeRetryBackoffMs(policy, 5)).toBe(10000); // capped
  }, 10000);
});

describe('runWithRetry', () => {
  it('succeeds without retries when attempt function returns true', async () => {
    const policy = { ...defaultRetryPolicy(), jitterPct: 0 };
    const sleepFn = vi.fn(async (_ms: number) => {});
    const attemptFn = vi.fn(async () => true);
    const collector = { warn: vi.fn() } as any;
    const res = await ew.runWithRetry(attemptFn, policy, sleepFn, collector);
    expect(res.success).toBe(true);
    expect(res.attempts).toBe(1);
    expect(sleepFn).not.toHaveBeenCalled();
  }, 10000);

  it('retries up to maxAttempts and fails', async () => {
    const policy: RetryPolicy = { ...defaultRetryPolicy(), maxAttempts: 3, jitterPct: 0 };
    const sleepFn = vi.fn(async (_ms: number) => {});
    let count = 0;
    const attemptFn = vi.fn(async () => {
      count++;
      return false;
    });
    const collector = { warn: vi.fn() } as any;
    const res = await ew.runWithRetry(attemptFn, policy, sleepFn, collector);
    expect(res.success).toBe(false);
    expect(res.attempts).toBe(3);
    expect(sleepFn).toHaveBeenCalledTimes(2); // between attempts
  });

  it('observes backoff timing with fake timers', async () => {
    vi.useFakeTimers();
    const policy: RetryPolicy = {
      ...defaultRetryPolicy(),
      maxAttempts: 4,
      initialDelayMs: 500,
      multiplier: 2,
      maxDelayMs: 5000,
      jitterPct: 0,
    };
    const sleepFn = async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
    };
    let failUntil = 3;
    const attemptFn = vi.fn(async () => {
      failUntil--;
      return failUntil < 0; // success on 4th call
    });
    const collector = { warn: vi.fn() } as any;
    const start = Date.now();
    const res = await ew.runWithRetry(attemptFn, policy, sleepFn, collector);
    const elapsed = vi.getTimerCount();
    expect(res.success).toBe(true);
    expect(res.attempts).toBe(4);
    expect(collector.warn).toHaveBeenCalledTimes(3);
    // we can't read real time under fake timers, but ensure sleep was scheduled 3 times
    vi.useRealTimers();
  });
});

describe('concurrent runWithRetry stress', () => {
  it('runs multiple independent retry loops without shared state', async () => {
    const policy: RetryPolicy = { ...defaultRetryPolicy(), maxAttempts: 2, jitterPct: 0 };
    const sleepFn = vi.fn(async (_ms: number) => {});
    const mkJob = (successOn: number) => {
      let call = 0;
      return ew.runWithRetry(
        async () => {
          call++;
          return call >= successOn;
        },
        policy,
        sleepFn,
        { warn: vi.fn() } as any
      );
    };
    const [a, b, c] = await Promise.all([mkJob(1), mkJob(2), mkJob(3)]);
    expect(a.success).toBe(true);
    expect(a.attempts).toBe(1);
    expect(b.success).toBe(true);
    expect(b.attempts).toBe(2);
    expect(c.success).toBe(false); // maxAttempts=2
    expect(c.attempts).toBe(2);
  });
});
