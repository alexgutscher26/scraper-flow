import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { CalculatorIcon } from "lucide-react";

export const DataTransformTask = {
  type: TaskType.DATA_TRANSFORM,
  label: "Data Transform",
  icon: (props) => <CalculatorIcon className="stroke-cyan-400" {...props} />,
  isEntryPoint: false,
  credits: 2,
  inputs: [
    {
      name: "Input data",
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: "Transform type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "uppercase", label: "To Uppercase" },
        { value: "lowercase", label: "To Lowercase" },
        { value: "trim", label: "Trim Whitespace" },
        { value: "replace", label: "Replace Text" },
        { value: "extract_numbers", label: "Extract Numbers" },
        { value: "extract_emails", label: "Extract Emails" },
        { value: "extract_urls", label: "Extract URLs" },
        { value: "json_pretty", label: "Format JSON" },
        { value: "base64_encode", label: "Base64 Encode" },
        { value: "base64_decode", label: "Base64 Decode" },
      ],
    },
    {
      name: "Find text",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Text to find (for replace transform)",
    },
    {
      name: "Replace with",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Replacement text (for replace transform)",
    },
  ] as const,
  outputs: [
    {
      name: "Transformed data",
      type: TaskParamType.STRING,
    },
  ] as const,
} satisfies WorkflowTask;
