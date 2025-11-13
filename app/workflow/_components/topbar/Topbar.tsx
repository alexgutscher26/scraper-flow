"use client";
import TooltipWrapper from "@/components/TooltipWrapper";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import SaveBtn from "./SaveBtn";
import ExecuteBtn from "./ExecuteBtn";
import NavigationTabs from "./NavigationTabs";
import PublishBtn from "./PublishBtn";
import UnpublishBtn from "./UnpublishBtn";
import PolitenessSettingsDialog from "./PolitenessSettingsDialog";

interface Props {
  title: string;
  subtitle?: string;
  workflowId: string;
  hideButtons?: boolean;
  isPublished?: boolean;
}
/**
 * Renders the Topbar component with navigation and action buttons.
 *
 * This component displays a header containing a title, an optional subtitle, and navigation buttons.
 * It uses the `useRouter` hook to enable back navigation and conditionally renders action buttons
 * based on the `hideButtons` and `isPublished` props. The `NavigationTabs` component is included
 * to facilitate workflow navigation.
 *
 * @param {Object} props - The properties for the Topbar component.
 * @param {string} props.title - The title to display in the Topbar.
 * @param {string} [props.subtitle] - An optional subtitle to display below the title.
 * @param {string} props.workflowId - The ID of the workflow for navigation and actions.
 * @param {boolean} [props.hideButtons=false] - Flag to hide action buttons.
 * @param {boolean} [props.isPublished=false] - Flag indicating if the workflow is published.
 */
function Topbar({
  title,
  subtitle,
  workflowId,
  hideButtons = false,
  isPublished = false,
}: Props) {
  const router = useRouter();
  return (
    <header className="flex p-2 border-b-2 border-separate justify-between w-full h-[60px] sticky top-0 bg-background z-10">
      <div className="flex gap-1 flex-1">
        <TooltipWrapper content="Back">
          <Button variant={"ghost"} size={"icon"} onClick={() => router.back()}>
            <ChevronLeftIcon size={20} />
          </Button>
        </TooltipWrapper>
        <div>
          <p className="font-bold text-ellipsis truncate">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground text-ellipsis truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <NavigationTabs workflowId={workflowId} />
      <div className="flex gap-1 flex-1 justify-end">
        {hideButtons === false && (
          <>
            <ExecuteBtn workflowId={workflowId} />
            {isPublished && <UnpublishBtn workflowId={workflowId} />}
            {!isPublished && (
              <>
                <PolitenessSettingsDialog />
                <SaveBtn workflowId={workflowId} />
                <PublishBtn workflowId={workflowId} />
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}

export default Topbar;
