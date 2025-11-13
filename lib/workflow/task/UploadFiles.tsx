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
    { name: "Files", type: TaskParamType.TEXTAREA, required: true, helperText: "One per line or comma-separated" },
    { name: "AcceptTypes", type: TaskParamType.STRING, required: false },
    { name: "MaxSizeMB", type: TaskParamType.NUMBER, required: false },
    { name: "UseDragAndDrop", type: TaskParamType.BOOLEAN, required: false },
    { name: "DropTargetSelector", type: TaskParamType.STRING, required: false },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
    { name: "UploadedFiles", type: TaskParamType.TEXTAREA },
    { name: "Success", type: TaskParamType.BOOLEAN },
  ] as const,
} satisfies WorkflowTask;

