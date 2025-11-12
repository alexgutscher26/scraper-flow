import prisma from "@/lib/prisma";
import { ExecutionWorkflow } from "@/lib/workflow/executionWorkflow";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import {
  ExecutionPhaseStatus,
  WorkflowExcetionTrigger,
  WorkflowExecutionPlan,
  WorkflowExecutionStatus,
} from "@/types/workflow";
import { timingSafeEqual } from "crypto";
import { parseWorkflowSchedule } from "@/lib/cron/scheduleParser";
import { createLogger } from "@/lib/log";

function isValidSecret(secret: string): boolean {
  const API_SECRET = process.env.API_SECRET;
  if (!API_SECRET) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(API_SECRET));
  } catch (error) {
    return false;
  }
}

export async function GET(req: Request, res: Response) {
  const logger = createLogger("api/workflows/execute");
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const select = authHeader.split(" ")[1];
  if (!isValidSecret(select)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId") as string;
  if (!workflowId) {
    return Response.json({ error: "WorkflowId is required" }, { status: 400 });
  }
  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
    },
  });

  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }
  const executionPlan = JSON.parse(
    workflow.executionPlan!
  ) as WorkflowExecutionPlan;
  if (!executionPlan) {
    return Response.json(
      { error: "Workflow execution plan not found" },
      { status: 404 }
    );
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
        trigger: isCronTrigger
          ? WorkflowExcetionTrigger.CRON
          : WorkflowExcetionTrigger.MANUAL,
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
    return new Response(null, { status: 200 });
  } catch (e) {
    logger.error(
      `Error executing workflow: ${e instanceof Error ? e.message : String(e)}`
    );
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
