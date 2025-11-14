'use client';
import React, { ReactNode, useEffect, useState } from 'react';
import { GetWorkflowExecutionWithPhases } from '@/actions/workflows/getWorkflowExecutionWithPhase';
import { ExecutionPhaseStatus, WorkflowExecutionStatus } from '@/types/workflow';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarIcon,
  CircleDashedIcon,
  ClockIcon,
  CoinsIcon,
  Loader2Icon,
  LucideIcon,
  WorkflowIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatesToDurationString } from '@/lib/helper/dates';
import { GetPhasesTotalCost } from '@/lib/helper/phases';
import { GetWorkflowPhaseDetails } from '@/actions/workflows/getWorkflowPhaseDetails';
import { Input } from '@/components/ui/input';
import { ExecutionLog } from '@prisma/client';
import { cn } from '@/lib/utils';
import { LogLevel } from '@/types/log';
import PhaseStatusBadge from './PhaseStatusBadge';
import ReactCountUpWrapper from '@/components/ReactCountUpWrapper';
import ScreenshotDownload from '@/components/screenshot/ScreenshotDownload';
import FileDownload from '@/components/file/FileDownload';

type ExecutionData = Awaited<ReturnType<typeof GetWorkflowExecutionWithPhases>>;
interface Props {
  initialData: ExecutionData;
}
/**
 * Renders the execution viewer component displaying workflow execution phases and their details.
 *
 * This component manages the state of the selected phase, fetches execution and phase details using queries,
 * and updates the UI based on the execution status. It also handles the grouping of phases and displays
 * relevant information such as duration, credits consumed, and dependencies for the selected phase.
 *
 * @param {Object} Props - The properties for the ExecutionViewer component.
 * @param {Object} Props.initialData - The initial data for the workflow execution.
 */
function ExecutionViewer({ initialData }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['execution', initialData?.id],
    initialData,
    queryFn: () => GetWorkflowExecutionWithPhases(initialData!.id),
    refetchInterval: (query) => {
      return query.state.data?.status === WorkflowExecutionStatus.RUNNING ? 1000 : false;
    },
  });

  const phaseDetails = useQuery({
    queryKey: ['phaseDetails', selectedPhase, query.data?.status],
    queryFn: () => GetWorkflowPhaseDetails(selectedPhase!),
    enabled: selectedPhase !== null,
  });

  const isRunning = query.data?.status === WorkflowExecutionStatus.RUNNING;

  const duration = DatesToDurationString(query.data?.completedAt, query.data?.startedAt);
  const creditConsumed = GetPhasesTotalCost(query.data?.phases || []);

  useEffect(() => {
    const phases = query?.data?.phases || [];
    if (isRunning) {
      const phaseToSelect = phases.toSorted((a, b) => (a.startedAt! > b.startedAt! ? -1 : 1))[0];
      setSelectedPhase(phaseToSelect?.id);
      return;
    }
    const phaseToSelect = phases.toSorted((a, b) => (a.completedAt! > b.completedAt! ? -1 : 1))[0];
    setSelectedPhase(phaseToSelect?.id);
  }, [query?.data?.phases, isRunning, setSelectedPhase]);

  const def = initialData?.definition ? JSON.parse(initialData.definition) : {};
  const edges = (def?.edges || []) as any[];
  const groups = (query.data?.phases || []).reduce<Record<number, typeof query.data.phases>>(
    (acc, p) => {
      const arr = acc[p.number] || [];
      arr.push(p);
      acc[p.number] = arr;
      return acc;
    },
    {}
  );
  const sortedGroups = Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <div className="flex h-full w-full">
      <aside className="flex w-[440px] min-w-[440px] max-w-[440px] flex-grow border-separate flex-col overflow-hidden border-r-2">
        <div className="px-2 py-4">
          {/* Status label */}
          <ExecutionLabel
            icon={CircleDashedIcon}
            label="Status"
            value={
              <div className="flex items-center gap-2 font-semibold capitalize">
                <PhaseStatusBadge status={query.data?.status as ExecutionPhaseStatus} />
                <span>{query?.data?.status}</span>
              </div>
            }
          />

          {/* Started at label */}
          <ExecutionLabel
            icon={CalendarIcon}
            label="Started at"
            value={
              <span className="lowercase">
                {query.data?.startedAt
                  ? formatDistanceToNow(new Date(query?.data?.startedAt), {
                      addSuffix: true,
                    })
                  : '-'}
              </span>
            }
          />
          <ExecutionLabel
            icon={ClockIcon}
            label="Duration"
            value={duration ? duration : <Loader2Icon className="animate-spin" size={20} />}
          />
          <ExecutionLabel
            icon={CoinsIcon}
            label="Credits Consumed"
            value={<ReactCountUpWrapper value={creditConsumed} />}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-center px-4 py-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <WorkflowIcon size={20} className="stroke-muted-foreground/80" />
            <span className="font-semibold">Phases</span>
          </div>
        </div>
        <Separator />
        <div className="h-full overflow-auto px-2 py-4">
          {sortedGroups.map(([num, phases], gi) => (
            <div key={num} className="mb-3">
              <div className="flex items-center justify-between px-1 py-1">
                <Badge variant="outline">Phase {num}</Badge>
                <span className="text-xs text-muted-foreground">{phases?.length} branch(es)</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {phases?.map((phase) => (
                  <Button
                    key={phase.id}
                    className="w-full justify-between"
                    variant={selectedPhase === phase.id ? 'secondary' : 'ghost'}
                    onClick={() => {
                      if (isRunning) return;
                      setSelectedPhase(phase.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{gi + 1}</Badge>
                      <p className="font-semibold">{phase.name}</p>
                    </div>
                    <PhaseStatusBadge status={phase.status as ExecutionPhaseStatus} />
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex h-full w-full">
        {isRunning && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <p className="font-bold">Run is in progress, please wait</p>
          </div>
        )}
        {!isRunning && !selectedPhase && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <div className="flex flex-col gap-1 text-center">
              <p className="font-bold">No phase selected</p>
              <p className="text-sm text-muted-foreground">Select a phase to view details</p>
            </div>
          </div>
        )}
        {!isRunning && selectedPhase && phaseDetails.data && (
          <div className="container flex flex-col gap-4 overflow-auto py-4">
            <div className="flex items-center gap-2">
              <Badge variant={'outline'} className="space-x-4">
                <div className="flex items-center gap-1">
                  <CoinsIcon size={18} className="stroke-muted-foreground" />
                  <span>Credits</span>
                  <span>{phaseDetails?.data?.creditsConsumed}</span>
                </div>
              </Badge>
              <Badge variant={'outline'} className="space-x-4">
                <div className="flex items-center gap-1">
                  <ClockIcon size={18} className="stroke-muted-foreground" />
                  <span>Duration</span>
                  <span>
                    {DatesToDurationString(
                      phaseDetails.data.completedAt,
                      phaseDetails.data.startedAt
                    ) || '-'}
                  </span>
                </div>
              </Badge>
            </div>
            <Card>
              <CardHeader className="rounded-lg rounded-b-none border-b bg-gray-50 py-4 dark:bg-background">
                <CardTitle className="text-base">Dependencies</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Incoming sources connected to this phase
                </CardDescription>
              </CardHeader>
              <CardContent className="py-3">
                <div className="flex flex-wrap gap-2">
                  {edges
                    .filter((e) => {
                      try {
                        const n = JSON.parse((phaseDetails.data as any).node);
                        return e.target === n.id;
                      } catch {
                        return false;
                      }
                    })
                    .map((e) => (
                      <Badge key={`${e.source}-${e.target}-${e.targetHandle}`} variant="outline">
                        {e.sourceHandle} → {e.targetHandle}
                      </Badge>
                    ))}
                  {edges.length === 0 && <span className="text-sm">No dependencies</span>}
                </div>
              </CardContent>
            </Card>
            <ParamaterViews
              title="Inputs"
              subTitle="Inputs used for this phase"
              phasesJson={phaseDetails.data.inputs}
            />
            <ParamaterViews
              title="Outputs"
              subTitle="Outputs used for this phase"
              phasesJson={phaseDetails.data.outputs}
            />
            <LogViewer logs={phaseDetails.data.logs} />
          </div>
        )}
      </div>
    </div>
  );
}

export default ExecutionViewer;

function ExecutionLabel({
  icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={20} className="stroke-muted-foreground/80" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 font-semibold capitalize">{value}</div>
    </div>
  );
}

function ParamaterViews({
  title,
  subTitle,
  phasesJson,
}: {
  title: string;
  subTitle: string;
  phasesJson: string | null;
}) {
  const params = phasesJson ? JSON.parse(phasesJson) : undefined;

  // Check if this is a screenshot output
  const hasScreenshot =
    params && params['Screenshot'] && params['Screenshot'].startsWith('data:image/');
  const screenshotName = (params && params['Screenshot name']) || 'screenshot';

  // Check if this is a file data output
  const hasFileData =
    params &&
    params['File data'] &&
    typeof params['File data'] === 'string' &&
    params['File data'].length > 0;
  const fileName = (params && params['File name']) || 'downloaded_file';

  return (
    <Card>
      <CardHeader className="rounded-lg rounded-b-none border-b bg-gray-50 py-4 dark:bg-background">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{subTitle}</CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <div className="flex flex-col gap-2">
          {(!params || Object.keys(params).length === 0) && (
            <p className="text-sm">No parameters generated by this phase</p>
          )}

          {/* Show screenshot viewer if this is a screenshot output */}
          {title === 'Outputs' && hasScreenshot && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium">Screenshot Preview</h3>
              <ScreenshotDownload dataUrl={params['Screenshot']} fileName={screenshotName} />
            </div>
          )}

          {/* Show file download if this is a file data output */}
          {title === 'Outputs' && hasFileData && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium">File Download</h3>
              <FileDownload base64Data={params['File data']} fileName={fileName} />
            </div>
          )}

          {params &&
            Object.entries(params).map(([key, value]) => {
              // Skip displaying File data in the regular input field since we show it as a download
              if (key === 'File data' && title === 'Outputs' && hasFileData) {
                return null;
              }

              return (
                <div key={key} className="flex items-center justify-between space-y-1">
                  <p className="base-1/3 flex-1 text-sm text-muted-foreground">{key}</p>
                  <Input readOnly className="base-2/3 flex-1" value={value as string} />
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Renders a log viewer component displaying execution logs.
 *
 * The component checks if logs are provided and renders a table with log details, including time, phase, task type, level, and message.
 * It allows users to toggle the visibility of additional metadata for each log entry.
 * If no logs are available, it returns null.
 *
 * @param {Object} props - The component props.
 * @param {ExecutionLog[] | undefined} props.logs - An array of execution logs or undefined.
 * @returns {JSX.Element | null} The rendered log viewer component or null if no logs are provided.
 */
function LogViewer({ logs }: { logs: ExecutionLog[] | undefined }) {
  if (!logs || logs.length === 0) return null;
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  /**
   * Toggles the open state of a row identified by the given id.
   */
  const toggleRow = (id: string) => setOpenRows((s) => ({ ...s, [id]: !s[id] }));
  return (
    <Card>
      <CardHeader className="rounded-lg rounded-b-none border-b bg-gray-50 py-4 dark:bg-background">
        <CardTitle className="text-base">Logs</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Logs generated by this phase
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="text-sm text-muted-foreground">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Phase</TableHead>
              <TableHead>Task Type</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <React.Fragment key={log.id}>
                <TableRow className="text-muted-foreground">
                  <TableCell width={190} className="p-[2px] pl-4 text-xs text-muted-foreground">
                    {log.timestamp.toISOString()}
                  </TableCell>
                  <TableCell width={160} className="p-[3px] pl-4 text-xs">
                    {log.phaseId ?? '-'}
                  </TableCell>
                  <TableCell width={160} className="p-[3px] pl-4 text-xs">
                    {String((log as any).taskType ?? '-')}
                  </TableCell>
                  <TableCell
                    width={80}
                    className={cn(
                      'text-bold p-[3px] pl-4 text-xs uppercase',
                      (log.logLevel as LogLevel) === 'error' && 'text-destructive',
                      (log.logLevel as LogLevel) === 'info' && 'text-primary'
                    )}
                  >
                    {log.logLevel}
                  </TableCell>
                  <TableCell className="flex-1 p-[3px] pl-4 text-sm">{log.message}</TableCell>
                  <TableCell width={120} className="p-[3px] pl-4">
                    <Button variant="outline" size="sm" onClick={() => toggleRow(log.id)}>
                      {openRows[log.id] ? 'Hide' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
                {openRows[log.id] && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-4">
                      <pre className="max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-background">
                        {JSON.stringify((log as any).metadata ?? {}, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export { LogViewer };
