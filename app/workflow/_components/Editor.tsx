"use client";
import { Workflow } from "@prisma/client";
import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowEditor from "./FlowEditor";
import Topbar from "./topbar/Topbar";
import TaskMenu from "./TaskMenu";
import { FlowValidationContextProvider } from "@/components/context/FlowValidationContext";
import { WorkflowStatus } from "@/types/workflow";
import { PolitenessSettingsProvider } from "@/components/context/PolitenessSettingsContext";
import { defaultPolitenessConfig } from "@/types/politeness";

interface Props {
  workflow: Workflow;
}
export default function Editor({ workflow }: Props) {
  let initialCfg = defaultPolitenessConfig();
  try {
    const def = JSON.parse(workflow.definition);
    const override = def?.settings?.politeness;
    if (override && typeof override === "object") {
      initialCfg = {
        robots: {
          enabled: override.robots?.enabled ?? initialCfg.robots.enabled,
          enforcement: override.robots?.enforcement ?? initialCfg.robots.enforcement,
          userAgentOverride: override.robots?.userAgentOverride ?? initialCfg.robots.userAgentOverride,
        },
        delays: {
          enabled: override.delays?.enabled ?? initialCfg.delays.enabled,
          minMs: override.delays?.minMs ?? initialCfg.delays.minMs,
          maxMs: override.delays?.maxMs ?? initialCfg.delays.maxMs,
          jitterPct: override.delays?.jitterPct ?? initialCfg.delays.jitterPct,
          strategy: override.delays?.strategy ?? initialCfg.delays.strategy,
        },
        userAgent: {
          enabled: override.userAgent?.enabled ?? initialCfg.userAgent.enabled,
          rotateStrategy: override.userAgent?.rotateStrategy ?? initialCfg.userAgent.rotateStrategy,
          pool: override.userAgent?.pool ?? initialCfg.userAgent.pool,
          headers: override.userAgent?.headers ?? initialCfg.userAgent.headers,
          acceptLanguageRandomization: override.userAgent?.acceptLanguageRandomization ?? initialCfg.userAgent.acceptLanguageRandomization,
        },
      } as any;
    }
  } catch {}
  return (
    <FlowValidationContextProvider>
      <ReactFlowProvider>
        <PolitenessSettingsProvider initial={initialCfg}>
          <div className="flex flex-col h-full w-full overflow-auto">
            <Topbar
              title="Workflow editor"
              subtitle={workflow.name}
              workflowId={workflow.id}
              isPublished={workflow.status === WorkflowStatus.PUBLISHED}
            />
            <section className="flex h-full overflow-auto">
              <TaskMenu />
              <FlowEditor workflow={workflow} />
            </section>
          </div>
        </PolitenessSettingsProvider>
      </ReactFlowProvider>
    </FlowValidationContextProvider>
  );
}
