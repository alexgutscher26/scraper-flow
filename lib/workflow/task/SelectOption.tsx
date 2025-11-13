import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { ListTreeIcon } from "lucide-react";

export const SelectOptionTask = {
  type: TaskType.SELECT_OPTION,
  label: "Select option",
  icon: (props) => <ListTreeIcon className="stroke-blue-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Selector", type: TaskParamType.STRING, required: true },
    {
      name: "Mode",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "single", label: "Single" },
        { value: "multiple", label: "Multiple" },
      ],
    },
    { name: "Values", type: TaskParamType.TEXTAREA, required: true, helperText: "Comma-separated for multiple" },
    { name: "SearchQuery", type: TaskParamType.STRING, required: false },
    { name: "UseKeyboard", type: TaskParamType.BOOLEAN, required: false },
    { name: "OptionFilter", type: TaskParamType.STRING, required: false },
    { name: "OpenTriggerSelector", type: TaskParamType.STRING, required: false },
    { name: "OptionSelector", type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
    { name: "SelectedValues", type: TaskParamType.TEXTAREA },
    { name: "Success", type: TaskParamType.BOOLEAN },
  ] as const,
} satisfies WorkflowTask;

