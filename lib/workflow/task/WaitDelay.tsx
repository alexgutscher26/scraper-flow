import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { ClockIcon } from "lucide-react";

export const WaitDelayTask = {
  type: TaskType.WAIT_DELAY,
  label: "Wait Delay",
  icon: (props) => <ClockIcon className="stroke-purple-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    {
      name: "Delay (seconds)",
      type: TaskParamType.NUMBER,
      required: true,
      helperText: "Number of seconds to wait",
      hideHandle: true,
    },
  ] as const,
  outputs: [] as const,
} satisfies WorkflowTask;
