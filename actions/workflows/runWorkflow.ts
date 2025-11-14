"use server";

import prisma from "@/lib/prisma";
import { FlowToExecutionPlan } from "@/lib/workflow/executionPlan";
import { RetryPolicy, defaultRetryPolicy } from "@/types/workflow";
import { ExecutionWorkflow } from "@/lib/workflow/executionWorkflow";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import {
  WorkflowExecutionStatus,
  WorkflowExcetionTrigger,
  WorkflowExecutionPlan,
  ExecutionPhaseStatus,
  WorkflowStatus,
} from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Executes a workflow based on the provided form data.
 *
 * The function first authenticates the user and checks for authorization. It then validates the presence of a workflowId and retrieves the corresponding workflow from the database. Depending on the workflow's status, it either uses an existing execution plan or generates a new one from the provided flow definition. Finally, it creates a new workflow execution record and triggers the execution in the background.
 *
 * @param form - An object containing the workflowId and an optional flowDefinition.
 * @param form.workflowId - The ID of the workflow to execute.
 * @param form.flowDefinition - An optional JSON string defining the flow if the workflow is a draft.
 * @throws Error If the user is unauthorized, workflowId is missing, workflow is not found, no execution plan is available, flow definition is invalid, or execution creation fails.
 */
export async function RunWorkflow(form: {
  workflowId: string;
  flowDefinition?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");
  const { workflowId, flowDefinition } = form;
  if (!workflowId) throw new Error("workflowId is required");

  const workflow = await prisma.workflow.findUnique({
    where: { userId, id: workflowId },
  });

  if (!workflow) throw new Error("workflow not found");

  let executionPlan: WorkflowExecutionPlan;
  let workflowDefinition = flowDefinition;

  if (workflow.status === WorkflowStatus.PUBLISHED) {
    if (!workflow.executionPlan)
      throw new Error("no execution plan found for published workflow");
    executionPlan = JSON.parse(workflow.executionPlan);
    workflowDefinition = workflow.definition;
  } else {
    //workflow is draft
    if (!flowDefinition) {
      throw new Error("flow definition is not defined");
    }
    const flow = JSON.parse(flowDefinition);
    const retry: RetryPolicy = {
      ...defaultRetryPolicy(),
      ...(flow?.settings?.retry || {}),
      strategy: "EXPONENTIAL",
    } as RetryPolicy;
    const result = FlowToExecutionPlan(flow.nodes, flow.edges, { retryPolicy: retry });

    if (result.error) throw new Error("flow definition is not valid");
    if (!result.executionPlan) throw new Error("no execution plan generated");

    executionPlan = result.executionPlan;
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId,
      status: WorkflowExecutionStatus.PENDING,
      startedAt: new Date(),
      trigger: WorkflowExcetionTrigger.MANUAL,
      definition: workflowDefinition,
      phases: {
        create: executionPlan.flatMap((phase) => {
          return phase.nodes.flatMap((node) => {
            return {
              userId,
              status: ExecutionPhaseStatus.CREATED,
              number: phase.phase,
              node: JSON.stringify(node),
              name: TaskRegistry[node.data.type].label,
            };
          });
        }),
      },
    },
    select: {
      id: true,
      phases: true,
    },
  });
  if (!execution) throw new Error("execution not created");
  ExecutionWorkflow(execution.id); // run this on background
  redirect(`/workflow/runs/${workflowId}/${execution.id}`);
}
