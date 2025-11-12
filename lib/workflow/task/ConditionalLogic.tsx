import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { FilterIcon } from "lucide-react";

export const ConditionalLogicTask = {
  type: TaskType.CONDITIONAL_LOGIC,
  label: "Conditional Logic",
  icon: (props) => <FilterIcon className="stroke-blue-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    {
      name: "Value 1",
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: "Operator",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "equals", label: "Equals" },
        { value: "not_equals", label: "Not Equals" },
        { value: "contains", label: "Contains" },
        { value: "not_contains", label: "Does Not Contain" },
        { value: "greater_than", label: "Greater Than" },
        { value: "less_than", label: "Less Than" },
        { value: "empty", label: "Is Empty" },
        { value: "not_empty", label: "Is Not Empty" },
      ],
    },
    {
      name: "Value 2",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Not required for 'empty' and 'not_empty' operators",
    },
  ] as const,
  outputs: [
    {
      name: "Result",
      type: TaskParamType.BOOLEAN,
    },
  ] as const,
} satisfies WorkflowTask;
