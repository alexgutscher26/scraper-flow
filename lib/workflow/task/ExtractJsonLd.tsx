import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Braces } from 'lucide-react';

export const ExtractJsonLdTask = {
  type: TaskType.EXTRACT_JSONLD,
  label: 'Extract JSON-LD',
  icon: (props) => <Braces className="stroke-emerald-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [{ name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true }] as const,
  outputs: [{ name: 'Json', type: TaskParamType.JSON }] as const,
} satisfies WorkflowTask;
