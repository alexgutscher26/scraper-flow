import {  TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Filter } from "lucide-react";

export const FilterDataTask = {
 type:TaskType.FILTER_DATA,
  label: "Extract Table Data",
  icon: (props) => <Filter {...props} />,
  isEntryPoint: false,
  credits: 3,
  inputs: [
    {
      name: "data",
      type: TaskParamType.JSON,
      label: "Data",
    },
    {
      name: "query",
      type: TaskParamType.STRING,
      label: "Query",
    },
  ] as const,
  outputs: [
    {
      name: "filteredData",
      type: TaskParamType.JSON,
      label: "Filtered Data",
    },
  ] as const,
}satisfies WorkflowTask;
