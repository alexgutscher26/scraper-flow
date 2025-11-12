"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  TriangleAlertIcon,
  TimerIcon,
} from "lucide-react";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { UpdateWorkflowCron } from "@/actions/workflows/updateWorkflowCron";
import { toast } from "sonner";
import cronstrue from "cronstrue";
import { RemoveWorkflowSchedule } from "@/actions/workflows/removeWorkflowSchedule";
import { Separator } from "@radix-ui/react-separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseWorkflowSchedule } from "@/lib/cron/scheduleParser";

export default function SchedulerDialog(props: {
  cron: string | null;
  workflowId: string;
}) {
  const [schedule, setSchedule] = useState(props.cron || "");
  const [scheduleType, setScheduleType] = useState<"cron" | "interval">("cron");
  const [validSchedule, setValidSchedule] = useState(false);
  const [readableSchedule, setReadableSchedule] = useState("");
  const [intervalValue, setIntervalValue] = useState("");
  const [intervalUnit, setIntervalUnit] = useState("m");

  useEffect(() => {
    if (!schedule) {
      setValidSchedule(false);
      return;
    }

    const intervalMatch = schedule.match(/^(\d+)([smhd])$/);
    if (intervalMatch) {
      const [, value, unit] = intervalMatch;

      try {
        const parsedSchedule = parseWorkflowSchedule(schedule);
        if (parsedSchedule.isValid) {
          setValidSchedule(true);
          setReadableSchedule(parsedSchedule.readableDescription);
          setScheduleType("interval");
          setIntervalValue(value);
          setIntervalUnit(unit);
        } else {
          setValidSchedule(false);
        }
      } catch (e) {
        setValidSchedule(false);
      }
      return;
    }
    try {
      // Use the common parseWorkflowSchedule function for cron expressions too
      const parsedCronSchedule = parseWorkflowSchedule(schedule);
      if (parsedCronSchedule.isValid && parsedCronSchedule.type === "cron") {
        setValidSchedule(true);
        setReadableSchedule(parsedCronSchedule.readableDescription);
        setScheduleType("cron");
      } else {
        setValidSchedule(false);
      }
    } catch (e) {
      setValidSchedule(false);
    }
  }, [schedule]);

  const mutation = useMutation({
    mutationFn: UpdateWorkflowCron,
    onSuccess: () => {
      toast.success("Workflow scheduled successfully", { id: "cron" });
    },
    onError: (error) => {
      toast.error(error.message, { id: "cron" });
    },
  });

  const removeScheduleMutation = useMutation({
    mutationFn: RemoveWorkflowSchedule,
    onSuccess: () => {
      toast.success("Workflow updated successfully", { id: "cron" });
    },
    onError: (error) => {
      toast.error(error.message, { id: "cron" });
    },
  });
  const workflowHasSchedule = props.cron && props.cron.length > 0;

  let savedScheduleDescription = "";
  if (workflowHasSchedule) {
    try {
      // Check if it's an interval expression (e.g., "2m", "1h", "30s")
      const intervalMatch = props.cron!.match(/^(\d+)([smhd])$/);
      if (intervalMatch) {
        // Use our custom function for interval formats
        const parsedSchedule = parseWorkflowSchedule(props.cron!);
        if (parsedSchedule.isValid) {
          savedScheduleDescription = parsedSchedule.readableDescription;
        } else {
          savedScheduleDescription = props.cron!;
        }
      } else {
        // Use cronstrue for standard cron expressions
        savedScheduleDescription = cronstrue.toString(props.cron!, {
          verbose: true,
        });
      }
    } catch (e) {
      savedScheduleDescription = props.cron!;
    }
  }

  const updateIntervalSchedule = useCallback(() => {
    if (intervalValue && intervalUnit) {
      const newSchedule = `${intervalValue}${intervalUnit}`;
      setSchedule(newSchedule);
    }
  }, [intervalValue, intervalUnit, setSchedule]);

  useEffect(() => {
    if (scheduleType === "interval") {
      updateIntervalSchedule();
    }
  }, [scheduleType, updateIntervalSchedule]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className={cn(
            "text-sm p-0 h-auto text-orange-500",
            workflowHasSchedule && "text-primary"
          )}
        >
          {workflowHasSchedule && (
            <div className="flex items-center gap-2">
              <ClockIcon />
              {savedScheduleDescription}
            </div>
          )}
          {!workflowHasSchedule && (
            <div className="flex items-center gap-1">
              <TriangleAlertIcon className="size-3" />
              Set schedule
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="px-0">
        <CustomDialogHeader
          title="Schedule workflow execution"
          icon={CalendarIcon}
        />
        <div className="p-6 space-y-4">
          <DialogDescription className="text-muted-foreground text-sm">
            Set up automatic execution of your workflow using a simple interval
            or cron expression. All times are in UTC.
          </DialogDescription>

          <Tabs
            defaultValue={scheduleType}
            onValueChange={(v) => setScheduleType(v as "cron" | "interval")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="interval" className="flex-1">
                <div className="flex items-center gap-2">
                  <TimerIcon className="h-4 w-4" />
                  Simple Interval
                </div>
              </TabsTrigger>
              <TabsTrigger value="cron" className="flex-1">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Cron Expression
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interval" className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Value"
                  min="1"
                  value={intervalValue}
                  onChange={(e) => {
                    setIntervalValue(e.target.value);
                    updateIntervalSchedule();
                  }}
                  className="w-24"
                />
                <select
                  value={intervalUnit}
                  onChange={(e) => {
                    setIntervalUnit(e.target.value);
                    updateIntervalSchedule();
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="s">Seconds</option>
                  <option value="m">Minutes</option>
                  <option value="h">Hours</option>
                  <option value="d">Days</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                The workflow will run repeatedly at this interval.
              </p>
            </TabsContent>

            <TabsContent value="cron" className="pt-4 space-y-4">
              <Input
                placeholder="Cron expression (e.g. */5 * * * *)"
                value={scheduleType === "cron" ? schedule : ""}
                onChange={(e) => setSchedule(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day-of-month month day-of-week
              </p>
              <p className="text-xs text-muted-foreground">
                Example: */5 * * * * (every 5 minutes)
              </p>
            </TabsContent>
          </Tabs>

          <div
            className={cn(
              "bg-accent rounded-md p-4 border text-sm border-destructive",
              validSchedule && "border-primary text-primary"
            )}
          >
            {validSchedule ? readableSchedule : "Invalid schedule format"}
          </div>
          {workflowHasSchedule && (
            <DialogClose asChild>
              <div className="px-0">
                <Button
                  className="w-full text-destructive border-destructive hover:text-destructive"
                  variant={"outline"}
                  disabled={
                    mutation.isPending || removeScheduleMutation.isPending
                  }
                  onClick={() => {
                    toast.loading("Removing schedule...", { id: "cron" });
                    removeScheduleMutation.mutate(props.workflowId);
                  }}
                >
                  Remove schedule
                </Button>
                <Separator className="my-4" />
              </div>
            </DialogClose>
          )}
        </div>
        <DialogFooter className="px-6 gap-2">
          <DialogClose asChild>
            <Button className="w-full" variant={"secondary"}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="w-full"
              disabled={mutation.isPending || !validSchedule}
              onClick={() => {
                toast.loading("Saving schedule...", { id: "cron" });
                mutation.mutate({ id: props.workflowId, cron: schedule });
              }}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
