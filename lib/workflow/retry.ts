import { LogCollector } from '@/types/log';
import { BackoffStrategy, RetryPolicy } from '@/types/workflow';

/**
 * Computes the backoff delay for the given attempt based on a retry policy.
 */
export function computeRetryBackoffMs(policy: RetryPolicy, attempt: number): number {
  const base = policy.initialDelayMs * Math.pow(policy.multiplier, Math.max(0, attempt - 1));
  const capped = Math.min(base, policy.maxDelayMs);
  if (policy.strategy !== BackoffStrategy.EXPONENTIAL) {
    return Math.round(capped);
  }
  const jitterPct = Math.max(0, Math.min(1, policy.jitterPct ?? 0));
  const jitter = capped * jitterPct;
  const jittered = capped + (Math.random() < 0.5 ? -jitter : jitter);
  return Math.round(Math.max(policy.initialDelayMs, Math.min(jittered, policy.maxDelayMs)));
}

/**
 * Core retry loop with backoff. Executes `attemptFn` until success or max attempts.
 */
export async function runWithRetry(
  attemptFn: () => Promise<boolean>,
  policy: RetryPolicy,
  sleepFn: (ms: number) => Promise<void>,
  collector: LogCollector
): Promise<{ success: boolean; attempts: number }> {
  let attempt = 1;
  while (attempt <= policy.maxAttempts) {
    const ok = await attemptFn();
    if (ok) {
      return { success: true, attempts: attempt };
    }
    if (!policy.retryOnFailure || attempt >= policy.maxAttempts) {
      return { success: false, attempts: attempt };
    }
    const backoffMs = computeRetryBackoffMs(policy, attempt);
    collector.warning(`Retrying. attempt=${attempt} backoffMs=${backoffMs}`);
    await sleepFn(backoffMs);
    attempt++;
  }
  return { success: false, attempts: policy.maxAttempts };
}
