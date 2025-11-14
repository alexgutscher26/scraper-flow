import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { FileCode } from 'lucide-react';

export const ExtractHtmlFromElementTask = {
  type: TaskType.EXTRACT_HTML_FROM_ELEMENT,
  label: 'Extract HTML From Element',
  icon: (props) => <FileCode className="stroke-teal-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Selector', type: TaskParamType.STRING, required: true },
  ] as const,
  outputs: [{ name: 'Html', type: TaskParamType.TEXTAREA }] as const,
} satisfies WorkflowTask;
