'use server';

import { PeriodToDateRange } from '@/lib/helper/dates';
import prisma from '@/lib/prisma';
import { Period } from '@/types/analytics';
import { WorkflowExecutionStatus } from '@/types/workflow';
import { auth } from '@clerk/nextjs/server';
const { COMPLETED, FAILED } = WorkflowExecutionStatus;

/**
 * Retrieves statistics for workflow executions within a specified period.
 *
 * The function first authenticates the user and checks for authorization. It then converts the provided period into a date range and queries the database for workflow executions that match the user ID and fall within the date range. The results are filtered by execution status and include credits consumed. Finally, it calculates the total credits consumed and the number of phases executed, returning these statistics as an object.
 *
 * @param {Period} period - The time period for which to retrieve workflow execution statistics.
 */
export const GetStatsCardsValues = async (period: Period) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('unauthorized');
  }
  const dateRange = PeriodToDateRange(period);
  const executions = await prisma.workflowExecution.findMany({
    where: {
      userId,
      startedAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
      status: {
        in: [COMPLETED, FAILED],
      },
    },
    select: {
      creditsConsumed: true,
      phases: {
        where: {
          creditsConsumed: {
            not: null,
          },
        },
        select: {
          creditsConsumed: true,
        },
      },
    },
  });

  const stats = {
    workflowExecutions: executions.length,
    creditsConsumed: 0,
    phasesExecutions: 0,
  };
  stats.creditsConsumed = executions.reduce((sum, execution) => {
    return sum + execution.creditsConsumed;
  }, 0);
  stats.phasesExecutions = executions.reduce((sum, execution) => {
    return sum + execution.phases.length;
  }, 0);
  return stats;
};
