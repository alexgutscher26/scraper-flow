import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { CameraIcon, LucideProps } from "lucide-react";

/**
 * Take Screenshot Task
 *
 * This task captures a screenshot of the current web page and returns it as a base64-encoded
 * image string that can be used in other tasks or delivered via webhook. The screenshot can be
 * of the entire page or just the visible area.
 */
export const TakeScreenshotTask = {
  type: TaskType.TAKE_SCREENSHOT,
  label: "Take Screenshot",
  icon: (props: LucideProps) => (
    <CameraIcon className="stroke-indigo-400" {...props} />
  ),
  isEntryPoint: false,
  credits: 3,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: "Full page",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "true", label: "Yes (Entire page)" },
        { value: "false", label: "No (Visible area only)" },
      ],
    },
    {
      name: "Screenshot name",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Name for the screenshot (optional)",
      hideHandle: true,
    },
    {
      name: "Quality",
      type: TaskParamType.SELECT,
      required: false,
      hideHandle: true,
      helperText: "Image quality (only for JPEG format)",
      options: [
        { value: "0", label: "Default" },
        { value: "50", label: "Low (50%)" },
        { value: "75", label: "Medium (75%)" },
        { value: "90", label: "High (90%)" },
        { value: "100", label: "Maximum (100%)" },
      ],
    },
  ] as const,
  outputs: [
    {
      name: "Screenshot",
      type: TaskParamType.STRING,
    },
    {
      name: "Screenshot name",
      type: TaskParamType.STRING,
    },
    {
      name: "Download URL",
      type: TaskParamType.STRING,
    },
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
    },
  ] as const,
} satisfies WorkflowTask;
