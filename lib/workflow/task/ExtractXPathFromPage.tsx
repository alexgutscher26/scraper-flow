import { TaskParamType, TaskType } from '@/types/TaskType';
import { WorkflowTask } from '@/types/workflow';
import { CrosshairIcon } from 'lucide-react';

export const ExtractXPathFromPageTask = {
  type: TaskType.EXTRACT_XPATH_FROM_PAGE,
  label: 'Extract with XPath (Page)',
  icon: (props) => <CrosshairIcon className="stroke-cyan-400" {...props} />,
  isEntryPoint: false,
  credits: 3,
  inputs: [
    {
      name: 'Web page',
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
    {
      name: 'XPath',
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: 'Attribute',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: 'textContent', label: 'Text Content' },
        { value: 'innerText', label: 'Inner Text' },
        { value: 'value', label: 'Value' },
        { value: 'href', label: 'Href' },
        { value: 'src', label: 'Src' },
        { value: 'html', label: 'Inner HTML' },
      ],
    },
    {
      name: 'All elements',
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: 'true', label: 'All' },
        { value: 'false', label: 'First only' },
      ],
    },
  ] as const,
  outputs: [
    {
      name: 'Extracted data',
      type: TaskParamType.STRING,
    },
    {
      name: 'Web page',
      type: TaskParamType.BROWSER_INSTANCE,
    },
  ] as const,
} satisfies WorkflowTask;
