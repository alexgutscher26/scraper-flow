"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { parseWorkflowSchedule } from "@/lib/cron/scheduleParser";
import { revalidatePath } from "next/cache";

export async function UpdateWorkflowCron({
  id,
  cron,
}: {
  id: string;
  cron: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }

  // Parse and validate the schedule expression
  const parsedSchedule = parseWorkflowSchedule(cron);

  if (!parsedSchedule.isValid || !parsedSchedule.nextRunDate) {
    throw new Error(
      "Invalid schedule format. Use either a valid cron expression (e.g. '*/5 * * * *') " +
        "or a simple interval (e.g. '5m', '1h', '1d')"
    );
  }

  try {
    // Update the workflow with the new schedule
    await prisma.workflow.update({
      where: {
        id,
        userId,
      },
      data: {
        cron,
        nextRunAt: parsedSchedule.nextRunDate,
      },
    });
  } catch (error: any) {
    throw new Error("Failed to update workflow schedule");
  }

  revalidatePath(`/workflows`);
}
