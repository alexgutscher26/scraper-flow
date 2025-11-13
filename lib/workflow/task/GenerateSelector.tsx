import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { MousePointerClick } from "lucide-react";

export const GenerateSelectorTask = {
  type: TaskType.GENERATE_SELECTOR_AI,
  label: "Generate Selector (AI)",
  icon: (props) => <MousePointerClick className="stroke-indigo-400" {...props} />,
  isEntryPoint: false,
  credits: 3,
  inputs: [
    { name: "Html", type: TaskParamType.STRING, required: true },
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: false },
    { name: "Target description", type: TaskParamType.STRING, required: false },
    {
      name: "Mode",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "strict", label: "Strict" },
        { value: "flexible", label: "Flexible" },
      ],
    },
    { name: "Specificity level", type: TaskParamType.NUMBER, required: true, hideHandle: true },
    {
      name: "Strategy",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "css", label: "CSS" },
        { value: "xpath", label: "XPath" },
        { value: "both", label: "Both" },
      ],
    },
    { name: "Preferred attributes", type: TaskParamType.STRING, required: false, helperText: "Comma separated" },
    { name: "Manual override selector", type: TaskParamType.STRING, required: false },
    { name: "Credentials", type: TaskParamType.CREDENTIAL, required: false, helperText: "Optional AI API key" },
  ] as const,
  outputs: [
    { name: "Primary selector", type: TaskParamType.STRING },
    { name: "Fallback selectors", type: TaskParamType.JSON },
    { name: "Selector report", type: TaskParamType.JSON },
  ] as const,
} satisfies WorkflowTask;
