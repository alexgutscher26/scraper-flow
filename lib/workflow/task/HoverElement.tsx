import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Hand } from 'lucide-react';

export const HoverElementTask = {
  type: TaskType.HOVER_ELEMENT,
  label: 'Hover Element',
  icon: (props) => <Hand className="stroke-orange-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Selector', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE }] as const,
} satisfies WorkflowTask;
