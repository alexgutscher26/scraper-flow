import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { NetworkIcon } from 'lucide-react';

export const InterceptNetworkTask = {
  type: TaskType.INTERCEPT_NETWORK,
  label: 'Intercept Network',
  icon: (props) => <NetworkIcon className="stroke-purple-400" {...props} />,
  isEntryPoint: false,
  credits: 4,
  inputs: [
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE, required: true },
    {
      name: 'URL pattern',
      type: TaskParamType.STRING,
      required: false,
      helperText: 'Substring or /regex/',
    },
    {
      name: 'Resource type',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: 'any', label: 'Any' },
        { value: 'xhr', label: 'XHR' },
        { value: 'fetch', label: 'Fetch' },
        { value: 'document', label: 'Document' },
        { value: 'script', label: 'Script' },
        { value: 'stylesheet', label: 'Stylesheet' },
        { value: 'image', label: 'Image' },
      ],
    },
    {
      name: 'Method',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: 'ANY', label: 'Any' },
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
      ],
    },
    { name: 'Duration (ms)', type: TaskParamType.NUMBER, required: true },
    { name: 'Max responses', type: TaskParamType.NUMBER, required: false },
    {
      name: 'Include body',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
  ] as const,
  outputs: [
    { name: 'Responses JSON', type: TaskParamType.STRING },
    { name: 'Web page', type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;
