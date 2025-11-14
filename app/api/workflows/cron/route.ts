import { getAppUrl } from '@/lib/helper/appUrl';
import prisma from '@/lib/prisma';
import { checkWorkflowCredits } from '@/lib/workflow/creditCheck';
import { WorkflowExecutionStatus, WorkflowStatus } from '@/types/workflow';
import { parseWorkflowSchedule } from '@/lib/cron/scheduleParser';
import { createLogger } from '@/lib/log';
import { http } from '@/lib/http';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit';
import { getEnv } from '@/lib/env';
import { reserveIdempotencyKey } from '@/lib/idempotency';

export async function GET(req: Request, res: Response) {
  const logger = createLogger('api/workflows/cron');
  const userId = req.headers.get('x-user-id');
  const ipHeader =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const hdrs = new Headers();
  let rl: {
    user: import('@/lib/rateLimit').RateLimitResult;
    global: import('@/lib/rateLimit').RateLimitResult;
    ip: import('@/lib/rateLimit').RateLimitResult;
    effective: import('@/lib/rateLimit').RateLimitResult;
  } | null = null;
  try {
    rl = await rateLimit('cron', userId, ipHeader, !!userId);
  } catch {
    const reset = Math.floor(Date.now() / 1000) + 60;
    rl = {
      user: { allowed: true, limit: 1000, remaining: 1000, reset },
      global: { allowed: true, limit: 1000, remaining: 1000, reset },
      ip: { allowed: true, limit: 1000, remaining: 1000, reset },
      effective: { allowed: true, limit: 1000, remaining: 1000, reset },
    };
  }
  const hasEffective = rl && 'effective' in rl;
  const headerSource = hasEffective
    ? rl.effective
    : userId
    ? rl.user
    : rl.global;
  applyRateLimitHeaders(hdrs, headerSource as any);
  const allowed = hasEffective
    ? rl.effective.allowed
    : userId
    ? rl.user.allowed && rl.global.allowed
    : rl.global.allowed;
  if (!allowed) {
    return new Response(null, { status: 429, headers: hdrs });
  }
  const now = new Date();
  let workflows: Array<{
    id: string;
    cron: string | null;
    userId: string;
    creditsCost: number;
    name: string;
  }> = [];
  try {
    workflows = await prisma.workflow.findMany({
      select: {
        id: true,
        cron: true,
        userId: true,
        creditsCost: true,
        name: true,
      },
      where: {
        status: WorkflowStatus.PUBLISHED,
        cron: {
          not: null,
        },
        nextRunAt: {
          lte: now,
        },
      },
    });
  } catch {}
  const workflowsRun = [];
  const workflowsSkipped = [];
  for (const workflow of workflows) {
    // Check if workflow can be executed (pre-check for sufficient credits)
    const creditCheckResult = await checkWorkflowCredits(workflow.id);

    if (creditCheckResult.canExecute) {
      let IDEMPOTENCY_TTL_SECONDS = '600';
      try {
        ({ IDEMPOTENCY_TTL_SECONDS } = getEnv());
      } catch {}
      const bucket = new Date(now);
      bucket.setSeconds(0, 0);
      const idemKey = `cron:${workflow.id}:${bucket.toISOString()}`;
      const reservation = await reserveIdempotencyKey(idemKey, Number(IDEMPOTENCY_TTL_SECONDS));
      if (!reservation.reserved) {
        workflowsSkipped.push({
          id: workflow.id,
          name: workflow.name,
          reason: 'duplicate_trigger',
          required: workflow.creditsCost,
          available: creditCheckResult.userCredits || 0,
        });
        logger.info(
          `Duplicate cron trigger detected for ${workflow.name} (${workflow.id}); skipping`
        );
        continue;
      }
      // Only trigger workflow if sufficient credits are available
      await triggerWorkflow(workflow.id, idemKey);
      workflowsRun.push({
        id: workflow.id,
        name: workflow.name,
        creditsCost: workflow.creditsCost,
        userCredits: creditCheckResult.userCredits,
      });
      logger.info(
        `Triggered workflow ${workflow.name} (${workflow.id}), credits: ${creditCheckResult.userCredits}/${workflow.creditsCost}`
      );
    } else {
      // Handle the case where workflow can't be executed
      logger.info(
        `Skipping workflow ${workflow.name} (${workflow.id}): ${creditCheckResult.reason}, required: ${workflow.creditsCost}`
      );

      // Import and use the logWorkflowCreditFailure function if the reason is insufficient credits
      if (creditCheckResult.reason === 'insufficient_credits' && creditCheckResult.workflow) {
        const { logWorkflowCreditFailure } = await import('@/lib/workflow/creditCheck');
        await logWorkflowCreditFailure(
          creditCheckResult.workflow.id,
          creditCheckResult.workflow.userId,
          creditCheckResult.workflow.creditsCost,
          creditCheckResult.userCredits || 0
        );
      }

      workflowsSkipped.push({
        id: workflow.id,
        name: workflow.name,
        reason: creditCheckResult.reason,
        required: workflow.creditsCost,
        available: creditCheckResult.userCredits || 0,
      });
    }

    // Update the next run time based on the schedule expression
    if (workflow.cron) {
      try {
        const nextRunAt = await calculateNextRun(workflow.cron);

        if (nextRunAt) {
          await prisma.workflow.update({
            where: { id: workflow.id },
            data: {
              nextRunAt,
              lastRunAt: creditCheckResult.canExecute ? now : undefined, // Only update lastRunAt if we actually ran the workflow
              // lastRunStatus: creditCheckResult.canExecute
              //   ? undefined
              //   : WorkflowExecutionStatus.SKIPPED_INSUFFICIENT_CREDITS, // Record skip reason if applicable
            },
          });
        }
      } catch (error) {
        logger.error(
          `Failed to update next run time for workflow ${workflow.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
  return Response.json(
    {
      workflowsScheduled: workflows.length,
      workflowsRun: workflowsRun.length,
      workflowsRunDetails: workflowsRun,
      workflowsSkipped: workflowsSkipped.length,
      skippedDetails: workflowsSkipped,
      timestamp: now.toISOString(),
    },
    { status: 200, headers: hdrs }
  );
}

/**
 * Calculates the next run time based on the schedule expression
 * Supports both standard cron expressions and simplified interval formats
 */
async function calculateNextRun(scheduleExpression: string): Promise<Date | null> {
  const parsedSchedule = parseWorkflowSchedule(scheduleExpression);

  if (parsedSchedule.isValid && parsedSchedule.nextRunDate) {
    return parsedSchedule.nextRunDate;
  }

  const logger = createLogger('api/workflows/cron');
  logger.error(`Invalid schedule expression: ${scheduleExpression}`);
  return null;
}

/**
 * Triggers a workflow execution by making a request to the execute endpoint.
 * This function constructs the API URL using the provided workflowId and logs the process of triggering the workflow.
 * It handles both successful and failed attempts to trigger the workflow, logging appropriate messages for each case.
 * The function is called only after a credit check is successful.
 *
 * @param {string} workflowId - The ID of the workflow to be triggered.
 */
async function triggerWorkflow(workflowId: string, idempotencyKey?: string) {
  const triggerApiUrl = getAppUrl(`api/workflows/execute?workflowId=${workflowId}`);

  try {
    const logger = createLogger('api/workflows/cron');
    logger.info(`Triggering workflow ${workflowId} (credit check passed)`);
    await http.request(triggerApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET!}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      cache: 'no-store',
      method: 'GET',
    });
    logger.info(`Successfully triggered workflow ${workflowId}`);
  } catch (err: any) {
    const logger = createLogger('api/workflows/cron');
    logger.error(
      `Failed to trigger workflow ${workflowId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
