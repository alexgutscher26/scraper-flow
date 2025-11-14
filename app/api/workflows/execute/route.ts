import prisma from '@/lib/prisma';
import { ExecutionWorkflow } from '@/lib/workflow/executionWorkflow';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import {
  ExecutionPhaseStatus,
  WorkflowExcetionTrigger,
  WorkflowExecutionPlan,
  WorkflowExecutionStatus,
} from '@/types/workflow';
import { timingSafeEqual } from 'crypto';
import { parseWorkflowSchedule } from '@/lib/cron/scheduleParser';
import { createLogger } from '@/lib/log';
import { getEnv, formatEnvError } from '@/lib/env';
import { rateLimit, applyRateLimitHeaders } from '@/lib/rateLimit';
import { getEnv } from '@/lib/env';
import {
  reserveIdempotencyKey,
  completeIdempotencyKey,
  getIdempotencyRecord,
} from '@/lib/idempotency';

function isValidSecret(secret: string): boolean {
  const { API_SECRET } = getEnv();
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch {
    return false;
  }
}

/**
 * Handles the execution of a workflow based on the incoming request.
 *
 * This function validates the request headers for authorization and rate limiting, retrieves the workflow by its ID,
 * and creates a workflow execution record. It also manages idempotency to prevent duplicate executions and handles
 * cron-triggered workflows by calculating the next run time. Errors are logged and appropriate responses are returned
 * based on the execution status and validation checks.
 *
 * @param req - The incoming request object containing headers and URL parameters.
 * @param res - The response object used to send back the desired HTTP response.
 * @returns A JSON response indicating the status of the workflow execution.
 * @throws Error If there are issues with the workflow execution or validation.
 */
export async function GET(req: Request, res: Response) {
  const logger = createLogger('api/workflows/execute');
  try {
    getEnv();
  } catch (err) {
    const msg = formatEnvError(err);
    logger.error(msg);
    return Response.json({ error: msg }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userIdHeader = req.headers.get('x-user-id');
  const ipHeader =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const rl = await rateLimit('execute', userIdHeader, ipHeader, true);
  const hdrs = new Headers();
  const hasEffective = rl && 'effective' in rl;
  const headerSource = hasEffective ? rl.effective : userIdHeader ? rl.user : rl.global;
  applyRateLimitHeaders(hdrs, headerSource as any);
  const allowed = hasEffective
    ? rl.effective.allowed
    : userIdHeader
    ? rl.user.allowed && rl.global.allowed
    : rl.global.allowed;
  if (!allowed) {
    return new Response(null, { status: 429, headers: hdrs });
  }
  const select = authHeader.split(' ')[1];
  if (!isValidSecret(select)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get('workflowId') as string;
  if (!workflowId) {
    return Response.json({ error: 'WorkflowId is required' }, { status: 400 });
  }
  const { IDEMPOTENCY_TTL_SECONDS } = getEnv();
  const idemHeader = req.headers.get('Idempotency-Key') || undefined;
  const bucket = new Date();
  bucket.setSeconds(0, 0);
  const idemKey = idemHeader || `exec:${workflowId}:${bucket.toISOString()}`;
  const reservation = await reserveIdempotencyKey(idemKey, Number(IDEMPOTENCY_TTL_SECONDS));
  if (!reservation.reserved) {
    const cached = reservation.existing || (await getIdempotencyRecord(idemKey));
    const body = cached?.value || { error: 'Duplicate or in-progress request', key: idemKey };
    return Response.json(body, { status: 409 });
  }
  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
    },
  });

  if (!workflow) {
    return Response.json({ error: 'Workflow not found' }, { status: 404 });
  }
  const executionPlan = JSON.parse(workflow.executionPlan!) as WorkflowExecutionPlan;
  if (!executionPlan) {
    return Response.json({ error: 'Workflow execution plan not found' }, { status: 404 });
  }

  try {
    // Determine if this is a cron-triggered execution
    const isCronTrigger = workflow.cron !== null;
    let nextRun = null; // If it's a cron-triggered workflow, calculate the next execution time
    if (isCronTrigger && workflow.cron) {
      try {
        const parsedSchedule = parseWorkflowSchedule(workflow.cron);
        if (parsedSchedule.isValid && parsedSchedule.nextRunDate) {
          nextRun = parsedSchedule.nextRunDate;
        } else {
          logger.error(`Invalid schedule format: ${workflow.cron}`);
        }
      } catch (error) {
        logger.error(
          `Error parsing schedule expression: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create workflow execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: workflow.userId,
        definition: workflow.definition,
        status: WorkflowExecutionStatus.PENDING,
        startedAt: new Date(),
        trigger: isCronTrigger ? WorkflowExcetionTrigger.CRON : WorkflowExcetionTrigger.MANUAL,
        phases: {
          create: executionPlan.flatMap((phase) => {
            return phase.nodes.flatMap((node) => {
              return {
                userId: workflow.userId,
                status: ExecutionPhaseStatus.CREATED,
                number: phase.phase,
                node: JSON.stringify(node),
                name: TaskRegistry[node.data.type].label,
              };
            });
          }),
        },
      },
    });
    await ExecutionWorkflow(execution.id, nextRun || undefined);
    const respBody = { status: 'completed', executionId: execution.id };
    await completeIdempotencyKey(idemKey, respBody, Number(IDEMPOTENCY_TTL_SECONDS));
    return Response.json(respBody, { status: 200, headers: hdrs });
  } catch (e) {
    logger.error(`Error executing workflow: ${e instanceof Error ? e.message : String(e)}`);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
