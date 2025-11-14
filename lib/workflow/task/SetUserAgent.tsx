import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Fingerprint } from 'lucide-react';

export const SetUserAgentTask = {
  type: TaskType.SET_USER_AGENT,
  label: 'Set User Agent',
  icon: (props) => <Fingerprint className="stroke-indigo-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    {
      name: 'Web page',
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: 'User agent',
      type: TaskParamType.STRING,
      helperText: 'Leave empty to use politeness rotation',
      hideHandle: true,
    },
    {
      name: 'Randomize accept-language',
      type: TaskParamType.BOOLEAN,
      helperText: 'Adds randomized Accept-Language header',
      hideHandle: true,
    },
  ] as const,
  outputs: [
    {
      name: 'Web page',
      type: TaskParamType.BROWSER_INSTANCE,
    },
  ] as const,
} satisfies WorkflowTask;
