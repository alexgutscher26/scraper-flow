import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { MonitorSmartphone } from 'lucide-react';

export const SetViewportSizeTask = {
  type: TaskType.SET_VIEWPORT_SIZE,
  label: 'Set Viewport Size',
  icon: (props) => <MonitorSmartphone className="stroke-blue-700" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Width', type: TaskParamType.NUMBER, required: true, hideHandle: true },
    { name: 'Height', type: TaskParamType.NUMBER, required: true, hideHandle: true },
    { name: 'Device scale factor', type: TaskParamType.NUMBER, hideHandle: true },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;
