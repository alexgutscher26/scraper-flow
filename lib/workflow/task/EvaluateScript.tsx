import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Terminal } from 'lucide-react';

export const EvaluateScriptTask = {
  type: TaskType.EVALUATE_SCRIPT,
  label: 'Evaluate Script',
  icon: (props) => <Terminal className="stroke-gray-700" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    { name: 'Script', type: TaskParamType.TEXTAREA, required: true, hideHandle: true },
    {
      name: 'Return type',
      type: TaskParamType.SELECT,
      options: ['string', 'json', 'boolean'],
      hideHandle: true,
    },
  ] as const,
  outputs: [{ name: 'Result', type: TaskParamType.JSON }] as const,
} satisfies WorkflowTask;
