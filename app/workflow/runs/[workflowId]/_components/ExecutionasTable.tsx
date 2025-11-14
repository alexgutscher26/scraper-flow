"use client";

import React from "react";
import { GetWorkflowExecutions } from "@/actions/workflows/getWorkflowExecutions";
import { GetWorkflowExecutionsPaginated } from "@/actions/workflows/getWorkflowExecutionsPaginated";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatesToDurationString } from "@/lib/helper/dates";
import { Badge } from "@/components/ui/badge";
import ExecutionStatusIndicator from "./ExecutionStatusIndicator";
import { WorkflowExecutionStatus } from "@/types/workflow";
import { CoinsIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useRef, useMemo } from "react";
import { useInfiniteScroll } from "@/lib/ui/hooks/useInfiniteScroll";
import { useScrollRestoration } from "@/lib/ui/hooks/useScrollRestoration";
import { useVirtualizer } from "@tanstack/react-virtual";

type InitialDataType = Awaited<ReturnType<typeof GetWorkflowExecutions>>;
/**
 * Renders a table of workflow executions with infinite scrolling.
 *
 * This function utilizes the useInfiniteQuery hook to fetch paginated workflow executions based on the provided workflowId. It manages the loading state and virtualizes the rows for efficient rendering. The table displays execution details such as ID, status, credits consumed, and the start time, with a loading indicator for additional pages.
 *
 * @param workflowId - The ID of the workflow for which executions are being fetched.
 * @param initialData - The initial data to populate the table before fetching more executions.
 * @returns A JSX element representing the executions table.
 */
export default function ExecutionasTable({
  workflowId,
  initialData,
}: {
  workflowId: string;
  initialData: InitialDataType;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null)
  useScrollRestoration(containerRef.current || undefined)

  const PAGE_SIZE = 50
  const initialCursor = initialData.length === PAGE_SIZE ? initialData[initialData.length - 1]?.id : undefined
  const inf = useInfiniteQuery({
    queryKey: ["executions", workflowId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const { items, nextCursorId } = await GetWorkflowExecutionsPaginated(workflowId, { cursorId: pageParam, take: PAGE_SIZE })
      return { items, nextCursorId }
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursorId,
    initialData: () => ({
      pages: [{ items: initialData, nextCursorId: initialCursor }],
      pageParams: [undefined],
    }),
  })

  const flatItems = useMemo(() => inf.data?.pages.flatMap(p => p.items) ?? [], [inf.data])
  const { loading } = useInfiniteScroll(() => {
    if (inf.isFetchingNextPage || !inf.hasNextPage) return
    return inf.fetchNextPage()
  }, { threshold: 0.8, root: containerRef.current, debounceMs: 250, disabled: inf.isFetching })

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 72,
    overscan: 10,
  })

  return (
    <div ref={containerRef} className="border rounded-lg shadow-md overflow-auto">
      <Table className="h-full">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consumed</TableHead>
            <TableHead className="text-right text-xs text-muted-foreground">
              Started at (desc)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="gap-2 h-full overflow-auto" style={{ position: 'relative', height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((vi) => {
            const execution = flatItems[vi.index]
            const duration = DatesToDurationString(
              execution.completedAt,
              execution.startedAt
            );
            const formattedStartedAt =
              execution.startedAt &&
              formatDistanceToNow(execution.startedAt, {
                addSuffix: true,
              });

            return (
              <TableRow
                key={execution.id}
                className="cursor-pointer"
                onClick={() => {
                  router.push(`/workflow/runs/${workflowId}/${execution.id}`);
                }}
                style={{ position: 'absolute', top: vi.start, height: vi.size, width: '100%' }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{execution.id}</span>
                    <div className="text-muted-foreground text-xs">
                      <span>Triggered via</span>
                      <Badge variant={"outline"}>{execution.trigger}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <ExecutionStatusIndicator
                        status={execution.status as WorkflowExecutionStatus}
                      />
                      <span className="font-semibold capitalize">
                        {execution.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mx-5">
                      {duration}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <CoinsIcon size={16} className="text-primary" />
                      <span className="font-semibold capitalize">
                        {execution.creditsConsumed}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mx-5">
                      Credits
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formattedStartedAt}
                </TableCell>
              </TableRow>
            );
          })}
          {inf.isFetchingNextPage && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-2 text-muted-foreground">
                Loading more...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
