import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { ChevronsRight } from "lucide-react";

export const PaginateNextButtonTask = {
  type: TaskType.PAGINATE_NEXT_BUTTON,
  label: "Paginate By Next Button",
  icon: (props) => <ChevronsRight className="stroke-purple-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Next selector", type: TaskParamType.STRING, required: true },
    { name: "Max pages", type: TaskParamType.NUMBER, hideHandle: true },
    { name: "Delay (ms)", type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

