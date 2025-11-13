import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { ShieldCheckIcon } from "lucide-react";

export const SolveCaptchaTask = {
  type: TaskType.SOLVE_CAPTCHA,
  label: "Solve captcha",
  icon: (props) => <ShieldCheckIcon className="stroke-purple-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: "CaptchaCredential", type: TaskParamType.CREDENTIAL, required: false },
  ] as const,
  outputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
    { name: "CaptchaSolved", type: TaskParamType.BOOLEAN },
    { name: "Provider", type: TaskParamType.STRING },
    { name: "Token", type: TaskParamType.STRING },
  ] as const,
} satisfies WorkflowTask;

