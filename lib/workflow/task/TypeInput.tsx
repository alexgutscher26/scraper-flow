import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Edit3Icon } from "lucide-react";

export const TypeInputTask = {
  type: TaskType.TYPE_INPUT,
  label: "Type input (enhanced)",
  icon: (props) => <Edit3Icon className="stroke-orange-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Selector", type: TaskParamType.STRING, required: true },
    { name: "Value", type: TaskParamType.STRING, required: true },
    {
      name: "Type",
      type: TaskParamType.SELECT,
      required: false,
      hideHandle: true,
      options: [
        { value: "text", label: "text" },
        { value: "number", label: "number" },
        { value: "email", label: "email" },
        { value: "password", label: "password" },
        { value: "tel", label: "tel" },
        { value: "url", label: "url" },
        { value: "search", label: "search" },
        { value: "date", label: "date" },
        { value: "time", label: "time" },
        { value: "datetime-local", label: "datetime-local" },
      ],
    },
    { name: "DebounceMs", type: TaskParamType.NUMBER, required: false },
    { name: "ValidatePattern", type: TaskParamType.STRING, required: false },
    { name: "MaxLength", type: TaskParamType.NUMBER, required: false },
    { name: "ClearBeforeType", type: TaskParamType.BOOLEAN, required: false },
    { name: "PressEnter", type: TaskParamType.BOOLEAN, required: false },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
    { name: "TypedValue", type: TaskParamType.STRING },
    { name: "Success", type: TaskParamType.BOOLEAN },
  ] as const,
} satisfies WorkflowTask;

