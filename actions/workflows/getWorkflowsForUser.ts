'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GetWorkflowsForUser() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  //   if (!userId) return redirectToSignIn()
  let workflows: Array<{
    id: string;
    userId: string;
    name: string;
    description: string | null;
    definition: string;
    executionPlan: string | null;
    creditsCost: number;
    status: string;
    cron: string | null;
    lastRunAt: Date | null;
    lastRunId: string | null;
    lastRunStatus: string | null;
    nextRunAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  try {
    workflows = await prisma.workflow.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  } catch {}
  return workflows;
}
