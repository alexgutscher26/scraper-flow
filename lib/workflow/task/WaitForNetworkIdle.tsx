import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Activity } from 'lucide-react';

export const WaitForNetworkIdleTask = {
  type: TaskType.WAIT_NETWORK_IDLE,
  label: 'Wait For Network Idle',
  icon: (props) => <Activity className="stroke-yellow-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Idle threshold (ms)', type: TaskParamType.NUMBER, hideHandle: true },
    { name: 'Timeout (ms)', type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;
