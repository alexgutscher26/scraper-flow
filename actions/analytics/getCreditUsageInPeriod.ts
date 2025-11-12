"use server";

import { PeriodToDateRange } from "@/lib/helper/dates";
import prisma from "@/lib/prisma";
import { Period } from "@/types/analytics";
import { ExecutionPhaseStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { eachDayOfInterval, format } from "date-fns";

type Stats = Record<
  string,
  {
    success: number;
    failed: number;
  }
>;
const { COMPLETED, FAILED } = ExecutionPhaseStatus;
export const GetCreditUsageInPeriod = async (period: Period) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }
  const dateRange = PeriodToDateRange(period);
  const dateFormat = "yyyy-MM-dd";

  // Initialize the stats object for the date range
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

  // Process data in batches to prevent exceeding Prisma's response size limit
  let processedAll = false;
  let skip = 0;
  const batchSize = 1000; // Adjust based on your data size

  while (!processedAll) {
    const executionsPhases = await prisma.executionPhase.findMany({
      where: {
        userId,
        startedAt: {
          gte: dateRange.startDate,
          lt: dateRange.endDate,
        },
        status: {
          in: [COMPLETED, FAILED],
        },
      },
      select: {
        startedAt: true,
        status: true,
        creditsConsumed: true,
      },
      skip: skip,
      take: batchSize,
      orderBy: {
        startedAt: "asc",
      },
    });

    // If we got fewer records than the batch size, we've processed everything
    if (executionsPhases.length < batchSize) {
      processedAll = true;
    }

    // Process this batch
    executionsPhases.forEach((phase) => {
      const date = format(phase.startedAt!, dateFormat);
      if (phase.status === COMPLETED) {
        stats[date].success += phase.creditsConsumed || 0;
      } else if (phase.status === FAILED) {
        stats[date].failed += phase.creditsConsumed || 0;
      }
    });

    // Move to the next batch
    skip += batchSize;
  }

  const result = Object.entries(stats).map(([date, infos]) => {
    return {
      date,
      ...infos,
    };
  });

  return result;
};
