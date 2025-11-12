import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { FileTextIcon } from "lucide-react";

export const ExtractTableDataTask = {
  type: TaskType.EXTRACT_TABLE_DATA,
  label: "Extract Table Data",
  icon: (props) => <FileTextIcon className="stroke-green-400" {...props} />,
  isEntryPoint: false,
  credits: 3,
  inputs: [
    {
      name: "Html",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Table selector",
      type: TaskParamType.STRING,
      required: true,
      helperText: "CSS selector for the table element",
    },
    {
      name: "Output format",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "json", label: "JSON Array" },
        { value: "csv", label: "CSV Format" },
      ],
    },
  ] as const,
  outputs: [
    {
      name: "Table data",
      type: TaskParamType.STRING,
    },
  ] as const,
} satisfies WorkflowTask;
