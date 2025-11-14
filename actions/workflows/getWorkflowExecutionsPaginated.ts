'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

type PaginatedOpts = { cursorId?: string; take?: number };

/**
 * Retrieve paginated workflow executions for a specific workflow.
 *
 * This function first authenticates the user and checks for a valid userId. It then determines the number of items to take based on the provided options, ensuring it is within the specified limits. Depending on whether a cursorId is provided, it fetches the workflow executions from the database, ordering them by creation date and returning the items along with a nextCursorId for further pagination.
 *
 * @param workflowId - The ID of the workflow for which executions are to be retrieved.
 * @param opts - Optional pagination options, including the number of items to take and a cursorId for pagination.
 * @returns An object containing the retrieved items and the nextCursorId for pagination.
 * @throws Error If the user is not authenticated.
 */
export async function GetWorkflowExecutionsPaginated(workflowId: string, opts: PaginatedOpts = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error('unauthenticated');
  const take = Math.max(1, Math.min(opts.take ?? 50, 200));
  const where = { workflowId, userId };
  if (opts.cursorId) {
    const items = await prisma.workflowExecution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      cursor: { id: opts.cursorId },
      skip: 1,
      take,
    });
    const nextCursorId = items.length === take ? items[items.length - 1]?.id : undefined;
    return { items, nextCursorId };
  }
  const items = await prisma.workflowExecution.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  });
  const nextCursorId = items.length === take ? items[items.length - 1]?.id : undefined;
  return { items, nextCursorId };
}
