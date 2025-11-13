"use server"

import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

type PaginatedOpts = { cursorId?: string; take?: number }

export async function GetWorkflowExecutionsPaginated(workflowId: string, opts: PaginatedOpts = {}) {
  const { userId } = await auth()
  if (!userId) throw new Error("unauthenticated")
  const take = Math.max(1, Math.min(opts.take ?? 50, 200))
  const where = { workflowId, userId }
  if (opts.cursorId) {
    const items = await prisma.workflowExecution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      cursor: { id: opts.cursorId },
      skip: 1,
      take,
    })
    const nextCursorId = items.length === take ? items[items.length - 1]?.id : undefined
    return { items, nextCursorId }
  }
  const items = await prisma.workflowExecution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
  })
  const nextCursorId = items.length === take ? items[items.length - 1]?.id : undefined
  return { items, nextCursorId }
}

