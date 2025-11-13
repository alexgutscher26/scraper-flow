import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { EyeOff } from "lucide-react";

export const WaitForSelectorHiddenTask = {
  type: TaskType.WAIT_FOR_SELECTOR_HIDDEN,
  label: "Wait For Selector Hidden",
  icon: (props) => <EyeOff className="stroke-yellow-700" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Selector", type: TaskParamType.STRING, required: true },
    { name: "Timeout (ms)", type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

