import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Move } from "lucide-react";

export const DragAndDropTask = {
  type: TaskType.DRAG_AND_DROP,
  label: "Drag And Drop",
  icon: (props) => <Move className="stroke-purple-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Source selector", type: TaskParamType.STRING, required: true },
    { name: "Target selector", type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

