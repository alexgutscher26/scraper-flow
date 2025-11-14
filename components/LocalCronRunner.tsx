'use client';

import { useEffect, useState, useRef } from 'react';
import { http } from '@/lib/http';

/**
 * Manages the execution of scheduled workflows through a local cron runner.
 *
 * This component periodically fetches the cron API endpoint to check for scheduled workflows,
 * enabling the runner based on the environment and configuration settings. It implements
 * exponential backoff for error handling and updates the state with the number of workflows
 * triggered and the last run time. The component does not render anything if the runner is inactive.
 *
 * @returns A JSX element containing debugging data attributes if the runner is active; otherwise, null.
 */
export function LocalCronRunner() {
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [workflowsTriggered, setWorkflowsTriggered] = useState(0);
  const [isRunnerActive, setIsRunnerActive] = useState(false);
  const failedAttemptsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Determine if we should enable the runner
    // Always enable in development, conditionally in production
    // NEXT_PUBLIC_LOCAL_CRON_FREQUENCY sets polling interval in milliseconds (default: 60000ms/1min)
    const shouldEnableRunner =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_LOCAL_CRON === 'true';

    const pollingInterval = Number(process.env.NEXT_PUBLIC_LOCAL_CRON_FREQUENCY) || 60000;

    if (shouldEnableRunner) {
      setIsRunnerActive(true);

      /**
       * Checks the cron job status and triggers workflows if necessary.
       *
       * This function makes an API call to retrieve the current status of cron workflows, updating the state with the number of workflows triggered and the last run time. It handles errors by implementing exponential backoff for repeated failures, ensuring that the polling interval is adjusted accordingly. If the API response is successful, it logs the number of workflows triggered; otherwise, it increments the failed attempts counter.
       *
       * @returns {Promise<void>} A promise that resolves when the cron check is complete.
       */
      const checkCron = async () => {
        try {
          // Add a unique timestamp to prevent any API route caching
          const timestamp = Date.now();
          const response = await http.get(`/api/workflows/cron?ts=${timestamp}`, {
            cache: 'no-store',
            headers: {
              pragma: 'no-cache',
              'cache-control': 'no-cache',
            },
          });
          if (response) {
            const data = response as any;
            setWorkflowsTriggered((prev) => prev + (data.workflowsRun || 0));
            setLastRun(new Date());
            failedAttemptsRef.current = 0;
            console.log(
              `Cron check completed: ${
                data.workflowsRun || 0
              } workflows triggered. Next check in ${pollingInterval / 1000}s`
            );
          } else {
            failedAttemptsRef.current += 1;
            console.error(`Cron check failed`);
          }
        } catch (error) {
          failedAttemptsRef.current += 1;
          console.error('Error checking cron:', error);

          // If we've had multiple consecutive failures, implement exponential backoff
          if (failedAttemptsRef.current > 3) {
            const backoffTime = Math.min(
              pollingInterval * 2 ** (failedAttemptsRef.current - 3),
              900000
            ); // Max 15 minutes
            console.log(
              `Backing off cron checks for ${backoffTime / 1000}s due to repeated failures`
            );

            // Clear current interval and set a one-time timeout with backoff
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }

            setTimeout(() => {
              checkCron();
              // Reset normal polling after the backoff period
              intervalRef.current = setInterval(checkCron, pollingInterval);
            }, backoffTime);

            return;
          }
        }
      };

      // Run immediately on mount
      checkCron();

      // Set interval for periodic checks
      intervalRef.current = setInterval(checkCron, pollingInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, []);

  // Don't render anything if runner is not active
  if (!isRunnerActive) return null;

  return (
    <div className="hidden">
      {/* Hidden component with data attributes for debugging */}
      <span data-last-cron-run={lastRun?.toISOString()} />
      <span data-workflows-triggered={workflowsTriggered} />
    </div>
  );
}
