import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { Link } from "lucide-react";

export const ExtractLinksFromPageTask = {
  type: TaskType.EXTRACT_LINKS_FROM_PAGE,
  label: "Extract Links From Page",
  icon: (props) => <Link className="stroke-emerald-500" {...props} />,
  isEntryPoint: false,
  credits: 1,
  inputs: [
    {
      name: "Web page",
      type: TaskParamType.BROWSER_INSTANCE,
      required: true,
    },
  ] as const,
  outputs: [
    {
      name: "Links",
      type: TaskParamType.JSON,
    },
  ] as const,
} satisfies WorkflowTask;

