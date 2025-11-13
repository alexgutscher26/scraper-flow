import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Keyboard } from "lucide-react";

export const PressKeyTask = {
  type: TaskType.PRESS_KEY,
  label: "Press Key",
  icon: (props) => <Keyboard className="stroke-blue-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Key", type: TaskParamType.SELECT, required: true, options: ["Enter","Escape","Tab","ArrowDown","ArrowUp","ArrowLeft","ArrowRight","PageDown","PageUp"] },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

