"use client";

import { useEffect, useState, useRef } from "react";

/**
 * This component provides support for scheduled workflows in both development and production
 * It periodically fetches the cron API endpoint to check for scheduled workflows
 * This acts as a failsafe when Vercel cron jobs hit frequency limitations
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
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_ENABLE_LOCAL_CRON === "true";

    const pollingInterval =
      Number(process.env.NEXT_PUBLIC_LOCAL_CRON_FREQUENCY) || 60000;

    if (shouldEnableRunner) {
      setIsRunnerActive(true);

      const checkCron = async () => {
        try {
          // Add a unique timestamp to prevent any API route caching
          const timestamp = Date.now();
          const response = await fetch(`/api/workflows/cron?ts=${timestamp}`, {
            // Prevent caching to ensure fresh checks
            cache: "no-store",
            headers: {
              pragma: "no-cache",
              "cache-control": "no-cache",
            },
          });

          if (response.ok) {
            const data = await response.json();
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
            console.error(`Cron check failed with status ${response.status}`);
          }
        } catch (error) {
          failedAttemptsRef.current += 1;
          console.error("Error checking cron:", error);

          // If we've had multiple consecutive failures, implement exponential backoff
          if (failedAttemptsRef.current > 3) {
            const backoffTime = Math.min(
              pollingInterval * 2 ** (failedAttemptsRef.current - 3),
              900000
            ); // Max 15 minutes
            console.log(
              `Backing off cron checks for ${
                backoffTime / 1000
              }s due to repeated failures`
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
