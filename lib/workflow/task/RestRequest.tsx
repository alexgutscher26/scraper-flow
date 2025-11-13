import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Server } from "lucide-react";

export const RestRequestTask = {
  type: TaskType.REST_REQUEST,
  label: "REST Request",
  icon: (props) => <Server className="stroke-sky-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Method", type: TaskParamType.SELECT, required: true, options: ["GET","POST","PUT","PATCH","DELETE"] },
    { name: "URL", type: TaskParamType.STRING, required: true },
    { name: "Headers JSON", type: TaskParamType.JSON, hideHandle: true },
    { name: "Body JSON", type: TaskParamType.JSON, hideHandle: true },
    { name: "Use browser context", type: TaskParamType.BOOLEAN, hideHandle: true },
  ] as const,
  outputs: [
    { name: "Response JSON", type: TaskParamType.JSON },
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

