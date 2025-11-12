import { UpdateWorkflow } from "@/actions/workflows/updateWorkflow";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useReactFlow } from "@xyflow/react";
import { CheckIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useContext } from "react";
import { PolitenessSettingsContext } from "@/components/context/PolitenessSettingsContext";

/**
 * Renders a button to save a workflow with the given workflowId.
 */
function SaveBtn({ workflowId }: { workflowId: string }) {
  const { toObject } = useReactFlow();
  const settingsCtx = useContext(PolitenessSettingsContext);

  const saveMutation = useMutation({
    mutationFn: UpdateWorkflow,
    onSuccess: () => {
      toast.success("Workflow saved", {
        id: "save-workflow",
      });
    },
    onError: () => {
      toast.error("Failed to save workflow", {
        id: "save-workflow",
      });
    },
  });
  return (
    <Button
      disabled={saveMutation.isPending}
      variant={"outline"}
      className="flex items-center gap-2"
      onClick={() => {
        const flow = toObject() as any;
        const workflowDefinition = JSON.stringify({
          ...flow,
          settings: {
            ...(flow.settings || {}),
            politeness: settingsCtx?.config,
          },
        });
        toast.loading("Saving workflow...", { id: "save-workflow" });
        saveMutation.mutate({
          id: workflowId,
          definition: workflowDefinition,
        });
      }}
    >
      <CheckIcon size={16} className="stroke-green-400" />
      Save
    </Button>
  );
}

export default SaveBtn;
