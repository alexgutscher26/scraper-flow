import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Send } from "lucide-react";

export const SubmitFormTask = {
  type: TaskType.SUBMIT_FORM,
  label: "Submit Form",
  icon: (props) => <Send className="stroke-green-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Form selector", type: TaskParamType.STRING, required: true },
    { name: "Wait for navigation", type: TaskParamType.BOOLEAN, hideHandle: true },
    { name: "Timeout (ms)", type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

