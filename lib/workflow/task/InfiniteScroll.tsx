import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { ChevronsDown } from 'lucide-react';

export const InfiniteScrollTask = {
  type: TaskType.INFINITE_SCROLL,
  label: 'Infinite Scroll',
  icon: (props) => <ChevronsDown className="stroke-blue-400" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    {
      name: 'Web page',
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: 'Max iterations',
      type: TaskParamType.NUMBER,
      helperText: 'Number of scrolls to perform (default 5)',
      required: false,
      hideHandle: true,
    },
    {
      name: 'Delay (ms)',
      type: TaskParamType.NUMBER,
      helperText: 'Delay between scrolls in milliseconds (default 1000)',
      required: false,
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
