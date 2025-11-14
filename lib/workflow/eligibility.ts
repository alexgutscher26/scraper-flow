'use server';

// import prisma from "../prisma";
import prisma from '@/lib/prisma';
import { checkWorkflowCredits } from './creditCheck';
import { WorkflowExecutionStatus, WorkflowStatus } from '@/types/workflow';
import { createLogger } from '@/lib/log';

/**
 * Checks if a workflow with scheduled cron job is eligible to run
 * This function performs pre-flight checks before scheduling a workflow
 *
 * @param workflowId The ID of the workflow to check
 * @returns Object with eligibility status and details
 */
export async function checkWorkflowEligibility(workflowId: string): Promise<{
  eligible: boolean;
  status: string;
  details: {
    workflow?: {
      id: string;
      name: string;
      creditsCost: number;
      status: string;
    };
    userCredits?: number;
    reason?: string;
    nextScheduledRun?: Date | null;
  };
}> {
  const logger = createLogger('workflow/eligibility');
  try {
    // Check if workflow exists and is published
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        name: true,
        status: true,
        creditsCost: true,
        cron: true,
        nextRunAt: true,
        userId: true,
      },
    });

    if (!workflow) {
      return {
        eligible: false,
        status: 'NOT_FOUND',
        details: {
          reason: 'Workflow not found',
        },
      };
    }

    // Check if workflow is published
    if (workflow.status !== WorkflowStatus.PUBLISHED) {
      return {
        eligible: false,
        status: 'NOT_PUBLISHED',
        details: {
          workflow: {
            id: workflow.id,
            name: workflow.name,
            creditsCost: workflow.creditsCost,
            status: workflow.status,
          },
          reason: 'Workflow is not published',
        },
      };
    }

    // Check if workflow has a cron schedule
    if (!workflow.cron) {
      return {
        eligible: false,
        status: 'NO_SCHEDULE',
        details: {
          workflow: {
            id: workflow.id,
            name: workflow.name,
            creditsCost: workflow.creditsCost,
            status: workflow.status,
          },
          reason: 'Workflow has no schedule',
        },
      };
    }

    // Check credits
    const creditCheck = await checkWorkflowCredits(workflowId);

    if (!creditCheck.canExecute) {
      return {
        eligible: false,
        status: 'INSUFFICIENT_CREDITS',
        details: {
          workflow: {
            id: workflow.id,
            name: workflow.name,
            creditsCost: workflow.creditsCost,
            status: workflow.status,
          },
          userCredits: creditCheck.userCredits,
          reason: creditCheck.reason || 'Insufficient credits',
          nextScheduledRun: workflow.nextRunAt,
        },
      };
    }

    // All checks passed
    return {
      eligible: true,
      status: 'READY',
      details: {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          creditsCost: workflow.creditsCost,
          status: workflow.status,
        },
        userCredits: creditCheck.userCredits,
        nextScheduledRun: workflow.nextRunAt,
      },
    };
  } catch (error) {
    logger.error(
      `Error checking workflow eligibility: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      eligible: false,
      status: 'ERROR',
      details: {
        reason: 'Error checking workflow eligibility',
      },
    };
  }
}
