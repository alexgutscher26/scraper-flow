import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { UploadIcon } from "lucide-react";

export const UploadFilesTask = {
  type: TaskType.UPLOAD_FILES,
  label: "Upload files",
  icon: (props) => <UploadIcon className="stroke-green-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "Selector", type: TaskParamType.STRING, required: true },
    { name: "Files", type: TaskParamType.TEXTAREA, required: true, helperText: "One per line or comma-separated (absolute or relative paths)" },
    { name: "AcceptTypes", type: TaskParamType.STRING, required: false, helperText: "Regex matched against full file path (e.g. \\.(png|jpg|pdf)$)" },
    { name: "MaxSizeMB", type: TaskParamType.NUMBER, required: false, helperText: "Maximum per-file size in MB" },
    { name: "UseDragAndDrop", type: TaskParamType.BOOLEAN, required: false },
    { name: "DropTargetSelector", type: TaskParamType.STRING, required: false },
    { name: "StrictMode", type: TaskParamType.BOOLEAN, required: false, helperText: "Fail fast on any invalid file; when off, skip invalid files" },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
    { name: "UploadedFiles", type: TaskParamType.TEXTAREA },
    { name: "UploadedCount", type: TaskParamType.NUMBER },
    { name: "UploadProgress", type: TaskParamType.NUMBER },
    { name: "ErrorMessage", type: TaskParamType.TEXTAREA },
    { name: "Success", type: TaskParamType.BOOLEAN },
  ] as const,
} satisfies WorkflowTask;
