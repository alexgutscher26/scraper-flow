import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Code2Icon } from "lucide-react";

export const GraphQLQueryTask = {
  type: TaskType.GRAPHQL_QUERY,
  label: "GraphQL Query",
  icon: (props) => <Code2Icon className="stroke-sky-400" {...props} />,
  isEntryPoint: false,
  credits: 4,
  inputs: [
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE, required: false },
    { name: "Endpoint URL", type: TaskParamType.STRING, required: true },
    { name: "Query", type: TaskParamType.TEXTAREA, required: true },
    { name: "Variables JSON", type: TaskParamType.TEXTAREA, required: false },
    {
      name: "Use browser context",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
  ] as const,
  outputs: [
    { name: "Response JSON", type: TaskParamType.STRING },
    { name: "Web page", type: TaskParamType.BROWSER_INSTANCE },
  ] as const,
} satisfies WorkflowTask;

