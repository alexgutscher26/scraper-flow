'use server';

import { PeriodToDateRange } from '@/lib/helper/dates';
import prisma from '@/lib/prisma';
import { Period } from '@/types/analytics';
import { WorkflowExecutionStatus } from '@/types/workflow';
import { auth } from '@clerk/nextjs/server';
import { eachDayOfInterval, format } from 'date-fns';

type Stats = Record<
  string,
  {
    success: number;
    failed: number;
  }
>;
/**
 * Retrieve statistics of workflow executions over a specified period.
 *
 * The function first authenticates the user and retrieves their ID. It then converts the provided period into a date range and fetches workflow execution data from the database. The statistics are calculated by iterating over each day in the date range, counting the number of successful and failed executions. Finally, it formats the results into an array of objects containing the date and corresponding execution counts.
 *
 * @param period - The time period for which to retrieve workflow execution statistics.
 * @returns An array of objects containing the date and counts of successful and failed executions for each day in the specified period.
 * @throws Error If the user is not found during authentication.
 */
export const GetWorkflowExecutionsStats = async (period: Period) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not found');
  }
  const dateRange = PeriodToDateRange(period);
  let executions: Array<{ startedAt: Date | null; status: string }> = [];
  try {
    executions = await prisma.workflowExecution.findMany({
      where: {
        userId,
        startedAt: {
          gte: dateRange.startDate,
          lt: dateRange.endDate,
        },
      },
    });
  } catch {}
  const dateFormat = 'yyyy-MM-dd';

  const stats: Stats = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  })
    .map((date) => format(date, dateFormat))
    .reduce((acc, date) => {
      acc[date] = {
        success: 0,
        failed: 0,
      };
      return acc;
    }, {} as any);

  executions.forEach((execution) => {
    const date = format(execution.startedAt!, dateFormat);
    if (execution.status === WorkflowExecutionStatus.COMPLETED) {
      stats[date].success += 1;
    }

    if (execution.status === WorkflowExecutionStatus.FAILED) {
      stats[date].failed += 1;
    }
  });
  const result = Object.entries(stats).map(([date, infos]) => {
    return {
      date,
      ...infos,
    };
  });

  return result;
};
