import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Tag } from 'lucide-react';

export const ExtractAttributeFromElementTask = {
  type: TaskType.EXTRACT_ATTRIBUTE_FROM_ELEMENT,
  label: 'Extract Attribute From Element',
  icon: (props) => <Tag className="stroke-teal-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Selector', type: TaskParamType.STRING, required: true },
    { name: 'Attribute name', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [{ name: 'Value', type: TaskParamType.STRING }] as const,
} satisfies WorkflowTask;
