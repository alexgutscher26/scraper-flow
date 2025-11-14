"use server";

import prisma from "@/lib/prisma";
import { FlowToExecutionPlan } from "@/lib/workflow/executionPlan";
import { RetryPolicy, defaultRetryPolicy } from "@/types/workflow";
import { CalculateWorkflowCost } from "@/lib/workflow/helpers";
import { WorkflowStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Publishes a workflow after validating its status and configuration.
 *
 * The function first authenticates the user and retrieves the workflow by its ID. It checks if the workflow exists and if its status is DRAFT.
 * Then, it parses the flow definition, applies a retry policy, and generates an execution plan. If any step fails, appropriate errors are thrown.
 * Finally, it updates the workflow in the database and revalidates the corresponding path.
 *
 * @param id - The unique identifier of the workflow to be published.
 * @param flowDefinition - The JSON string representing the workflow's flow definition.
 * @throws Error If authentication fails, the workflow is not found, the status is invalid, the flow configuration is invalid, or the execution plan generation fails.
 */
export async function PublishWorkflow({
  id,
  flowDefinition,
}: {
  id: string;
  flowDefinition: string;
}) {
  const { userId } = await auth();
  if (!userId)
    throw new Error(
      "Authentication required. Please sign in to publish a workflow."
    );

  const workflow = await prisma.workflow.findUnique({
    where: {
      id,
      userId,
    },
  });
  if (!workflow) {
    throw new Error(
      "Workflow not found. The specified workflow may have been deleted or you don't have access to it."
    );
  }

  if (workflow.status !== WorkflowStatus.DRAFT) {
    throw new Error(
      "Invalid workflow status. Only draft workflows can be published."
    );
  }
  const flow = JSON.parse(flowDefinition);
  const retry: RetryPolicy = {
    ...defaultRetryPolicy(),
    ...(flow?.settings?.retry || {}),
    strategy: "EXPONENTIAL",
  } as RetryPolicy;
  const result = FlowToExecutionPlan(flow.nodes, flow.edges, { retryPolicy: retry });
  if (result.error) {
    throw new Error(`Invalid flow configuration: ${result.error}`);
  }

  if (!result.executionPlan) {
    throw new Error(
      "Failed to generate execution plan. Please check your workflow configuration."
    );
  }
  const creditsCost = CalculateWorkflowCost(flow.nodes);
  await prisma.workflow.update({
    where: {
      id,
      userId,
    },
    data: {
      definition: flowDefinition,
      executionPlan: JSON.stringify(result.executionPlan),
      creditsCost,
      status: WorkflowStatus.PUBLISHED,
    },
  });
  revalidatePath(`/workflows/${id}`);
}
