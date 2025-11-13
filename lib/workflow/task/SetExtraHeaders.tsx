import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { FilePlus } from "lucide-react";

export const SetExtraHeadersTask = {
  type: TaskType.SET_EXTRA_HEADERS,
  label: "Set Extra Headers",
  icon: (props) => <FilePlus className="stroke-pink-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Headers JSON", type: TaskParamType.JSON, required: true },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

