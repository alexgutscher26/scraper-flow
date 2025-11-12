"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkWorkflowRunEligibility } from "@/actions/workflows/checkWorkflowRunEligibility";
import { Badge } from "@/components/ui/badge";
import { CoinsIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import  TooltipWrapper  from "@/components/TooltipWrapper";

/**
 * Component to display workflow eligibility status
 * This can be used in the workflow card or editor to show if a workflow will run when scheduled
 */
export function WorkflowEligibilityStatus({
  workflowId,
  creditsCost,
}: {
  workflowId: string;
  creditsCost: number;
}) {
  const [eligibility, setEligibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const checkEligibility = async () => {
    try {
      setChecking(true);
      const result = await checkWorkflowRunEligibility(workflowId);
      setEligibility(result);
    } catch (error) {
      console.error("Error checking eligibility:", error);
    } finally {
      setChecking(false);
    }
  };

  // If we haven't checked eligibility yet, show just a check button
  if (!eligibility) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={checkEligibility}
        disabled={checking}
      >
        {checking ? "Checking..." : "Check Run Eligibility"}
      </Button>
    );
  }

  // Show status based on eligibility
  return (
    <div className="flex items-center space-x-2">
      <TooltipWrapper
        content={
          eligibility.eligible
            ? `Ready to run. You have ${eligibility.details.userCredits} credits (${creditsCost} required)`
            : `Cannot run: ${eligibility.details.reason}`
        }
      >
        <Badge
          variant={eligibility.eligible ? "outline" : "destructive"}
          className={`space-x-2 ${
            eligibility.eligible ? "text-green-600" : "text-destructive"
          }`}
        >
          {eligibility.eligible ? (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              <span>Ready to run</span>
            </>
          ) : (
            <>
              <AlertCircleIcon className="h-4 w-4" />
              <span>{eligibility.status}</span>
            </>
          )}
        </Badge>
      </TooltipWrapper>

      <TooltipWrapper content="Credit requirement">
        <Badge variant="outline" className="space-x-2 text-muted-foreground">
          <CoinsIcon className="h-4 w-4" />
          <span>{creditsCost}</span>
        </Badge>
      </TooltipWrapper>
    </div>
  );
}
