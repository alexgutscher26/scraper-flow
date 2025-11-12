"use server";

// import prisma from "../prisma";
import prisma from "@/lib/prisma";
import { createLogger } from "@/lib/log";

/**
 * Checks if a user has sufficient credits to run a workflow
 * This function should be used before initiating workflow execution
 *
 * @param userId The ID of the user who owns the workflow
 * @param requiredCredits The number of credits required to run the workflow
 * @returns Boolean indicating if user has sufficient credits
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const logger = createLogger("workflow/credits");
  try {
    // Find the user's balance
    const balance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    // If no balance record exists or credits are less than required
    if (!balance || balance.credits < requiredCredits) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error(
      `Error checking credits: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Check if a workflow can be executed based on its credit cost and user's balance
 * This function should be used specifically for cron jobs to determine execution eligibility
 *
 * @param workflowId The ID of the workflow to check
 * @returns An object containing eligibility status and related information
 */
export async function checkWorkflowCredits(workflowId: string): Promise<{
  canExecute: boolean;
  workflow?: { id: string; userId: string; creditsCost: number; name: string };
  userCredits?: number;
  reason?: string;
}> {
  const logger = createLogger("workflow/credits");
  try {
    // Get workflow details with creditsCost
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        userId: true,
        creditsCost: true,
        name: true,
      },
    });

    if (!workflow) {
      return {
        canExecute: false,
        reason: "workflow_not_found",
      };
    }

    // Get user's current balance
    const balance = await prisma.userBalance.findUnique({
      where: { userId: workflow.userId },
      select: { credits: true },
    });

    if (!balance) {
      return {
        canExecute: false,
        workflow,
        userCredits: 0,
        reason: "no_user_balance",
      };
    }

    // Check if user has enough credits
    if (balance.credits < workflow.creditsCost) {
      return {
        canExecute: false,
        workflow,
        userCredits: balance.credits,
        reason: "insufficient_credits",
      };
    }

    // All checks passed
    return {
      canExecute: true,
      workflow,
      userCredits: balance.credits,
    };
  } catch (error) {
    logger.error(
      `Error checking workflow credits: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      canExecute: false,
      reason: "error_checking_credits",
    };
  }
}

/**
 * Checks and reserves credits for the entire workflow execution
 * This function is used before running any phases to ensure the workflow has enough credits to complete
 *
 * @param userId The user ID who owns the workflow
 * @param workflowId The workflow ID being executed
 * @param totalCreditsRequired The total credits required for the entire workflow
 * @returns Object containing success status and user's credits information
 */
export async function checkAndReserveWorkflowCredits(
  userId: string,
  workflowId: string,
  totalCreditsRequired: number
): Promise<{
  success: boolean;
  userCredits?: number;
  errorReason?: string;
  reserved?: boolean;
}> {
  const logger = createLogger("workflow/credits");
  try {
    // First check if user has enough credits
    const balance = await prisma.userBalance.findUnique({
      where: { userId },
      select: { credits: true },
    });

    if (!balance) {
      return {
        success: false,
        errorReason: "no_user_balance",
      };
    }

    if (balance.credits < totalCreditsRequired) {
      return {
        success: false,
        userCredits: balance.credits,
        errorReason: "insufficient_credits",
      };
    }

    // We have enough credits - no need to decrement here
    // Credits will be decremented only when tasks are actually executed
    return {
      success: true,
      userCredits: balance.credits,
      reserved: true,
    };
  } catch (error) {
    logger.error(
      `Error checking workflow credits: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      success: false,
      errorReason: "error_checking_credits",
    };
  }
}

/**
 * Logs a workflow credit failure for tracking and analytics
 *
 * @param workflowId The ID of the workflow that failed
 * @param userId The user ID who owns the workflow
 * @param creditsCost The credits cost of the workflow
 * @param availableCredits The user's available credits
 */
export async function logWorkflowCreditFailure(
  workflowId: string,
  userId: string,
  creditsCost: number,
  availableCredits: number
) {
  const logger = createLogger("workflow/credits");
  try {
    // Record the credit failure in a format that could be used for analytics
    // This doesn't exist in the current schema, but could be added if needed
    logger.warning(
      `[Credit Failure Log] Workflow ${workflowId} failed due to insufficient credits. Required: ${creditsCost}, Available: ${availableCredits}`
    );

    // Here you could add code to store this information in the database
    // For example, you could create a WorkflowCreditFailure model
    // or add a field to an existing analytics model
  } catch (error) {
    logger.error(
      `Error logging workflow credit failure: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
