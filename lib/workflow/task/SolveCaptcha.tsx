import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { ShieldCheckIcon } from 'lucide-react';

export const SolveCaptchaTask = {
  type: TaskType.SOLVE_CAPTCHA,
  label: 'Solve captcha',
  icon: (props) => <ShieldCheckIcon className="stroke-purple-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'CaptchaCredential', type: TaskParamType.CREDENTIAL, required: false },
    {
      name: 'SecurityLevel',
      type: TaskParamType.SELECT,
      required: false,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    {
      name: 'CaptchaType',
      type: TaskParamType.SELECT,
      required: false,
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Visible', value: 'visible' },
        { label: 'Invisible', value: 'invisible' },
      ],
    },
  ] as const,
  outputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE },
    { name: 'CaptchaSolved', type: TaskParamType.BOOLEAN },
    { name: 'Provider', type: TaskParamType.STRING },
    { name: 'Token', type: TaskParamType.STRING },
    { name: 'VerificationPassed', type: TaskParamType.BOOLEAN },
  ] as const,
} satisfies WorkflowTask;
