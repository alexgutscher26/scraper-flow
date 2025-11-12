import { TaskParamType, TaskType } from "@/types/TaskType";
import { WorkflowTask } from "@/types/workflow";
import { MailIcon } from "lucide-react";

export const SendEmailTask = {
  type: TaskType.SEND_EMAIL,
  label: "Send Email",
  icon: (props) => <MailIcon className="stroke-red-400" {...props} />,
  isEntryPoint: false,
  credits: 3,
  inputs: [
    {
      name: "Email credentials",
      type: TaskParamType.CREDENTIAL,
      required: true,
      helperText: "Gmail credentials",
    },
    {
      name: "To email",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Recipient email address",
    },
    {
      name: "Subject",
      type: TaskParamType.STRING,
      required: true,
    },
    {
      name: "Body",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Body type",
      type: TaskParamType.SELECT,
      required: true,
      hideHandle: true,
      options: [
        { value: "text", label: "Plain Text" },
        { value: "html", label: "HTML" },
      ],
    },
    {
      name: "Attachments",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Base64 encoded file data (optional)",
      variant: "textarea",
    },
  ] as const,
  outputs: [
    {
      name: "Status",
      type: TaskParamType.STRING,
    },
  ] as const,
} satisfies WorkflowTask;
