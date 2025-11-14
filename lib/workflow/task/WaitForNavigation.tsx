import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Navigation } from 'lucide-react';

export const WaitForNavigationTask = {
  type: TaskType.WAIT_FOR_NAVIGATION,
  label: 'Wait For Navigation',
  icon: (props) => <Navigation className="stroke-yellow-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Timeout (ms)', type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;
