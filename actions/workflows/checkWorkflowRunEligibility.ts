"use server";

import { checkWorkflowEligibility } from "@/lib/workflow/eligibility";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * Server action to check if a workflow is eligible to run
 * This can be used in the UI to show the user if their workflow will run
 *
 * @param workflowId The ID of the workflow to check
 */
export async function checkWorkflowRunEligibility(workflowId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Ensure the workflow belongs to the current user
  const workflow = await prisma.workflow.findUnique({
    where: {
      id: workflowId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found or access denied");
  }

  return checkWorkflowEligibility(workflowId);
}
