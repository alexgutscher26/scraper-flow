import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { Regex } from 'lucide-react';

export const RegexExtractTask = {
  type: TaskType.REGEX_EXTRACT,
  label: 'Regex Extract',
  icon: (props) => <Regex className="stroke-indigo-600" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    { name: 'Text', type: TaskParamType.STRING, required: true },
    { name: 'Pattern', type: TaskParamType.STRING, required: true, hideHandle: true },
    { name: 'Flags', type: TaskParamType.STRING, hideHandle: true },
  ] as const,
  outputs: [{ name: 'Matches', type: TaskParamType.JSON }] as const,
} satisfies WorkflowTask;
