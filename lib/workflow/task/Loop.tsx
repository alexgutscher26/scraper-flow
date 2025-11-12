import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { RepeatIcon } from "lucide-react";

export const LoopTask = {
  type: TaskType.LOOP,
  label: "Loop",
  icon: (props) => <RepeatIcon className="stroke-yellow-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    {
      name: "Array data",
      type: TaskParamType.STRING,
      required: true,
      helperText: "JSON array to iterate over",
      variant: "textarea",
    },
    {
      name: "Max iterations",
      type: TaskParamType.NUMBER,
      required: false,
      hideHandle: true,
      helperText: "Maximum number of iterations (optional)",
    },
  ] as const,
  outputs: [
    {
      name: "Current item",
      type: TaskParamType.STRING,
    },
    {
      name: "Current index",
      type: TaskParamType.NUMBER,
    },
    {
      name: "Is last",
      type: TaskParamType.BOOLEAN,
    },
  ] as const,
} satisfies WorkflowTask;
