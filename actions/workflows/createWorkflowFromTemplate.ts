"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { WorkflowStatus } from "@/types/workflow";
import { auth } from "@clerk/nextjs/server";
import { buildTemplate, templateCredits } from "@/lib/workflow/templates";

const schema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(80).optional(),
  templateKey: z.enum(["example_html", "example_screenshot", "comprehensive_capture"]),
  websiteUrl: z.string().url().optional(),
});

export async function CreateWorkflowFromTemplate(form: z.infer<typeof schema>) {
  const parsed = schema.safeParse(form);
  if (!parsed.success) throw new Error("Invalid form data");
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");
  const flow = buildTemplate(parsed.data.templateKey, parsed.data.websiteUrl);
  const creditsCost = templateCredits(parsed.data.templateKey);
  const result = await prisma.workflow.create({
    data: {
      userId,
      status: WorkflowStatus.DRAFT,
      definition: JSON.stringify(flow),
      name: parsed.data.name,
      description: parsed.data.description,
      creditsCost,
    },
  });
  if (!result) throw new Error("Failed to create workflow");
  redirect(`/workflow/editor/${result.id}`);
}
