import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { DownloadIcon } from "lucide-react";

export const DownloadFileTask = {
  type: TaskType.DOWNLOAD_FILE,
  label: "Download File",
  icon: (props) => <DownloadIcon className="stroke-indigo-400" {...props} />,
  isEntryPoint: false,
  credits: 4,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: "File URL",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Direct URL to the file or link selector",
    },
    {
      name: "URL type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "direct", label: "Direct URL" },
        { value: "selector", label: "Link Selector" },
      ],
    },
    {
      name: "File name",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Custom filename (optional)",
      hideHandle: true,
    },
  ] as const,
  outputs: [
    {
      name: "File data",
      type: TaskParamType.STRING,
    },
    {
      name: "File name",
      type: TaskParamType.STRING,
    },
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
    },
  ] as const,
} satisfies WorkflowTask;
