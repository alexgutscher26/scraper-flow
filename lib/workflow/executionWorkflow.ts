import "server-only";
// import prisma from "../prisma";
import prisma from "@/lib/prisma";
import {
  ExecutionPhaseStatus,
  WorkflowExecutionStatus,
} from "@/types/workflow";
import { ExecutionPhase } from "@prisma/client";
import { AppNode } from "@/types/appNode";
import { TaskRegistry } from "./task/registry";
import { TaskParamType, TaskType } from "@/types/TaskType";
import { ExecutorRegistry } from "./executor/registry";
import { Environment, ExecutionEnvironment } from "@/types/executor";
import { Browser, Page } from "puppeteer";
import { Browser as BrowserCore, Page as PageCore } from "puppeteer-core";
import { revalidatePath } from "next/cache";
import { Edge } from "@xyflow/react";
import { LogCollector } from "@/types/log";
import { createLogCollector } from "../log";
import { sanitizeObject } from "@/lib/logSecure/sanitizer";
import { createLogger } from "@/lib/log";
import { defaultPolitenessConfig, PolitenessConfig, PolitenessState } from "@/types/politeness";
import { defaultNetworkConfig, NetworkConfig, NetworkState } from "@/types/network";
import { ProxyManager } from "@/lib/network/proxyManager";
import { SessionManager } from "@/lib/network/cookieJar";
import { computeDelayMs, sleep } from "@/lib/politeness/delay";

import { checkAndReserveWorkflowCredits } from "./creditCheck";
import { getCredentialValue } from "../credential/getCredentialValue";

export async function ExecutionWorkflow(executionId: string, nextRun?: Date) {
  const logger = createLogger("workflow/execution");
  const execution = await prisma.workflowExecution.findUnique({
    where: { id: executionId },
    include: { phases: true, workflow: true },
  });
  if (!execution) throw new Error("execution not found");

  const edges = JSON.parse(execution.workflow.definition).edges as Edge[];
  const environment: Environment = {
    phases: {},
  };
  environment.politenessConfig = resolvePolitenessConfig(execution.workflow.definition);
  environment.politenessState = { robotsCache: new Map(), uaPerDomain: new Map() } as PolitenessState;
  environment.network = { config: resolveNetworkConfig(execution.workflow.definition) } as NetworkState;
  if (environment.network?.config?.proxy?.enabled) {
    environment.network.proxy = new ProxyManager(environment.network.config.proxy);
  }
  if (environment.network?.config?.cookies?.enabled) {
    const ttl = environment.network.config.cookies?.sessionTtlMs || 30 * 60 * 1000;
    environment.network.session = new SessionManager(ttl);
  }

  await initializeWorkflowExecution(executionId, execution.workflowId, nextRun);
  await initializePhaseStatused(execution);

  let executionFailed = false;
  let creditsConsumed = 0;

  // Calculate total credits required for this workflow
  const totalCreditsRequired = execution.workflow.creditsCost;

  // Pre-check credits availability for the entire workflow
  const creditsCheck = await checkAndReserveWorkflowCredits(
    execution.userId,
    execution.workflowId,
    totalCreditsRequired
  );

  // If we don't have enough credits, mark the execution as failed and early return
  if (!creditsCheck.success) {
    const firstPhaseId = execution.phases[0]?.id;
    const logCollector = createLogCollector({ phaseId: firstPhaseId, taskType: "SYSTEM", metadata: { scope: "workflow", reason: "INSUFFICIENT_CREDITS" } });
    logCollector.error(
      `Insufficient credits to run workflow. Required: ${totalCreditsRequired}, Available: ${
        creditsCheck.userCredits || 0
      }`
    );

    // Update execution status to show credit-related failure
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: WorkflowExecutionStatus.FAILED,
        completedAt: new Date(),
        // Add a log entry to record the reason
        phases: {
          update: {
            where: { id: execution.phases[0]?.id },
            data: {
              status: ExecutionPhaseStatus.FAILED,
              completedAt: new Date(),
              logs: {
                create: {
                  message: `Workflow execution failed - insufficient credits (Required: ${totalCreditsRequired}, Available: ${creditsCheck.userCredits || 0})`,
                  logLevel: "error",
                  timestamp: new Date(),
                  phaseId: firstPhaseId ?? execution.phases[0]?.id ?? "",
                  taskType: "SYSTEM",
                  metadata: {
                    scope: "workflow",
                    required: totalCreditsRequired,
                    available: creditsCheck.userCredits || 0,
                  },
                },
              },
            },
          },
        },
      },
    });

    await prisma.workflow
      .update({
        where: { id: execution.workflowId, lastRunId: executionId },
        data: { lastRunStatus: WorkflowExecutionStatus.FAILED },
      })
      .catch(() => {
        /* ignore - workflow might have been deleted */
      });

    return;
  }

  // If we have enough credits, proceed with execution
  for (const phase of execution.phases) {
    const phaseExecution = await execitopnWorkflowPhase(
      phase,
      environment,
      edges,
      execution.userId
    );
    creditsConsumed += phaseExecution.creditsConsumed;
    if (!phaseExecution.success) {
      executionFailed = true;
      break;
    }
  }
  await finalizeWorkflowExecution(
    executionId,
    execution.workflowId,
    executionFailed,
    creditsConsumed
  );

  await cleanupEnvironment(environment);
  revalidatePath("/workflows/runs");
}

async function initializeWorkflowExecution(
  executionId: string,
  workflowId: string,
  nextRunAt?: Date
) {
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      startedAt: new Date(),
      status: WorkflowExecutionStatus.RUNNING,
    },
  });
  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      lastRunAt: new Date(),
      lastRunId: executionId,
      lastRunStatus: WorkflowExecutionStatus.RUNNING,
      ...(nextRunAt && { nextRunAt }),
    },
  });
}

async function initializePhaseStatused(execution: any) {
  await prisma.executionPhase.updateMany({
    where: {
      id: {
        in: execution.phases.map((phase: any) => phase.id),
      },
    },
    data: { status: ExecutionPhaseStatus.PENDING },
  });
}
async function finalizeWorkflowExecution(
  executionId: string,
  workflowId: string,
  executionFailed: boolean,
  creditsConsumed: number
) {
  const finalStatus = executionFailed
    ? WorkflowExecutionStatus.FAILED
    : WorkflowExecutionStatus.COMPLETED;

  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      creditsConsumed,
    },
  });

  await prisma.workflow
    .update({
      where: { id: workflowId, lastRunId: executionId },
      data: {
        lastRunStatus: finalStatus,
      },
    })
    .catch((err) => {
      //ignore
      //this means that the workflow was deleted before the execution was completed
    });
}

async function execitopnWorkflowPhase(
  phase: ExecutionPhase,
  environment: Environment,
  edges: Edge[],
  userId: string
) {
  const node = JSON.parse(phase.node) as AppNode;
  let logCollector = createLogCollector({ phaseId: phase.id, taskType: node.data.type, metadata: { scope: "phase", nodeId: node.id, phaseNumber: phase.number } });
  const startedAt = new Date();
  await setupEnvironmentForPhase(node, environment, edges, userId, logCollector, phase.id);
  await maybePoliteDelay(node.data.type, environment, logCollector);
  await prisma.executionPhase.update({
    where: { id: phase.id },
    data: {
      status: ExecutionPhaseStatus.RUNNING,
      startedAt,
      inputs: JSON.stringify(environment.phases[node.id].inputs),
    },
  });

  const creditsRequired = TaskRegistry[node.data.type].credits;
  logCollector.info(`Running task ${node.data.type} with ${creditsRequired} credits`);
  // TODO
  let success = await decrementCredits(userId, creditsRequired, logCollector);
  const creditsConsumed = success ? creditsRequired : 0;

  if (success) {
    // we can run the task if credits are available
    success = await executePhase(phase, node, environment, logCollector);
  }

  const outputs = environment.phases[node.id].outputs;

  await finalizePhase(
    phase.id,
    node.data.type,
    success,
    outputs,
    logCollector,
    creditsConsumed
  );

  return { success, creditsConsumed };
}

async function finalizePhase(
  phaseId: string,
  taskType: TaskType,
  success: boolean,
  outputs: any,
  logCollector: LogCollector,
  creditsConsumed: number
) {
  const status = success
    ? ExecutionPhaseStatus.COMPLETED
    : ExecutionPhaseStatus.FAILED;

  // Filter out BROWSER_INSTANCE outputs before serialization
  const serializableOutputs = filterSerializableOutputs(outputs);

  await prisma.executionPhase.update({
    where: { id: phaseId },
    data: {
      status,
      completedAt: new Date(),
      outputs: JSON.stringify(sanitizeObject(serializableOutputs)),
      creditsConsumed,
      logs: {
        createMany: {
          data: logCollector.getAll().map((log) => ({
            message: log.message,
            logLevel: log.level,
            timestamp: log.timestamp,
            phaseId: log.phaseId ?? phaseId,
            taskType: log.taskType ?? taskType,
            metadata: log.metadata ?? { scope: "phase" },
          })),
        },
      },
    },
  });
}

function filterSerializableOutputs(outputs: any): any {
  if (!outputs || typeof outputs !== "object") {
    return outputs;
  }

  const filtered = { ...outputs };

  // Remove outputs that contain browser instances (pages, browsers, or functions)
  Object.keys(filtered).forEach((key) => {
    const value = filtered[key];
    if (value && typeof value === "object") {
      // Check if it looks like a browser instance (has common puppeteer methods/properties)
      if (
        typeof value.evaluate === "function" ||
        typeof value.goto === "function" ||
        typeof value.close === "function" ||
        typeof value.newPage === "function" ||
        value.constructor?.name === "CDPPage" ||
        value.constructor?.name === "CDPBrowser" ||
        value.constructor?.name === "Page" ||
        value.constructor?.name === "Browser"
      ) {
        // Replace browser instances with a placeholder to indicate they were filtered
        filtered[key] = "[Browser Instance - Not Serializable]";
      }
    }
  });

  return filtered;
}

async function executePhase(
  phase: ExecutionPhase,
  node: AppNode,
  environment: Environment,
  logCollector: LogCollector
): Promise<boolean> {
  const runFn = ExecutorRegistry[node.data.type];
  if (!runFn) {
    logCollector.error(`Executor not found for ${node.data.type}`);
    return false;
  }
  const executionEnvironment: ExecutionEnvironment<any> =
    createExecutionEnvironment(node, environment, logCollector);
  return await runFn(executionEnvironment);
}

async function setupEnvironmentForPhase(
  node: AppNode,
  environment: Environment,
  edges: Edge[],
  userId: string,
  logCollector: LogCollector,
  phaseId: string
) {
  environment.phases[node.id] = {
    inputs: {},
    outputs: {},
  };
  const inputs = TaskRegistry[node.data.type].inputs;
  for (const input of inputs) {
    if (input.type === TaskParamType.BROWSER_INSTANCE) continue;
    const inputVal = node.data.inputs[input.name];
    if (inputVal) {
      // Handle credential inputs by resolving them to formatted values
      if (input.type === TaskParamType.CREDENTIAL) {
        try {
          const credentialValue = await getCredentialValue(inputVal, userId, {
            requester: `workflow/${node.data.type}`,
            method: "db",
            correlationId: phaseId,
          });
          environment.phases[node.id].inputs[input.name] = credentialValue;
        } catch (error) {
          logCollector.error(
            `Failed to resolve credential ${inputVal}: ${error instanceof Error ? error.message : String(error)}`
          );
          // Continue execution but with undefined credential - executor will handle the error
          environment.phases[node.id].inputs[input.name] = undefined;
        }
      } else {
        environment.phases[node.id].inputs[input.name] = inputVal;
      }
      continue;
    }

    const connectedEdge = edges.find(
      (edge) => edge.target === node.id && edge.targetHandle === input.name
    );
    if (!connectedEdge) {
      logCollector.error(`Input not found for ${node.id} ${input.name}`);
      continue;
    }
    const outputValue =
      environment.phases[connectedEdge.source].outputs[
        connectedEdge.sourceHandle!
      ];
    environment.phases[node.id].inputs[input.name] = outputValue;
  }
}
function createExecutionEnvironment(
  node: AppNode,
  environment: Environment,
  logCollector: LogCollector
): ExecutionEnvironment<any> {
  return {
    getInput: (name: string) => environment?.phases[node.id]?.inputs[name],
    setOutput: (name: string, value: string) => {
      environment.phases[node.id].outputs[name] = value;
    },
    getBrowser: () => environment.browser,
    setBrowser: (browser: Browser | BrowserCore) =>
      (environment.browser = browser),

    getPage: () => environment.page,
    setPage: (page: Page | PageCore) => (environment.page = page),
    log: logCollector,
    getPolitenessConfig: () => environment.politenessConfig,
    getPolitenessState: () => environment.politenessState,
    getNetwork: () => environment.network,
  };
}

async function cleanupEnvironment(environment: Environment) {
  if (environment.browser) {
    await environment.browser.close().catch((err) => {
      const logger = createLogger("workflow/execution");
      logger.error(
        `cannot closing browser: ${err instanceof Error ? err.message : String(err)}`
      );
    });
  }
}

async function decrementCredits(
  userId: string,
  amount: number,
  logCollector: LogCollector
) {
  try {
    // Since we already checked credits upfront, we can directly decrement here
    // But we still do a safety check just in case
    const balance = await prisma.userBalance.findUnique({
      where: { userId },
      select: { credits: true },
    });

    if (!balance) {
      logCollector.error(
        `User balance record not found. Credits required: ${amount}`
      );
      return false;
    }

    if (balance.credits < amount) {
      logCollector.error(
        `Insufficient credits. Available: ${balance.credits}, Required: ${amount}`
      );
      return false;
    }

    // Proceed with decrementing credits
    await prisma.userBalance.update({
      where: { userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });
    logCollector.info(
      `Successfully deducted ${amount} credits. Remaining balance: ${
        balance.credits - amount
      }`
    );
    return true;
  } catch (error) {
    logCollector.error(
      `Failed to process credits: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return false;
  }
}

function resolvePolitenessConfig(definitionJson: string): PolitenessConfig {
  const base = defaultPolitenessConfig();
  try {
    const def = JSON.parse(definitionJson);
    const override = def?.settings?.politeness;
    if (override && typeof override === "object") {
      return {
        robots: {
          enabled: override.robots?.enabled ?? base.robots.enabled,
          enforcement: override.robots?.enforcement ?? base.robots.enforcement,
          userAgentOverride: override.robots?.userAgentOverride ?? base.robots.userAgentOverride,
        },
        delays: {
          enabled: override.delays?.enabled ?? base.delays.enabled,
          minMs: override.delays?.minMs ?? base.delays.minMs,
          maxMs: override.delays?.maxMs ?? base.delays.maxMs,
          jitterPct: override.delays?.jitterPct ?? base.delays.jitterPct,
          strategy: override.delays?.strategy ?? base.delays.strategy,
        },
        userAgent: {
          enabled: override.userAgent?.enabled ?? base.userAgent.enabled,
          rotateStrategy: override.userAgent?.rotateStrategy ?? base.userAgent.rotateStrategy,
          pool: override.userAgent?.pool ?? base.userAgent.pool,
          headers: override.userAgent?.headers ?? base.userAgent.headers,
          acceptLanguageRandomization: override.userAgent?.acceptLanguageRandomization ?? base.userAgent.acceptLanguageRandomization,
        },
      } as PolitenessConfig;
    }
  } catch {}
  return base;
}

function resolveNetworkConfig(definitionJson: string): NetworkConfig {
  const base = defaultNetworkConfig();
  try {
    const def = JSON.parse(definitionJson);
    const override = def?.settings?.network;
    if (override && typeof override === "object") {
      return {
        proxy: {
          enabled: override.proxy?.enabled ?? base.proxy?.enabled ?? false,
          rotateStrategy: override.proxy?.rotateStrategy ?? base.proxy?.rotateStrategy,
          providers: override.proxy?.providers ?? base.proxy?.providers,
          healthCheckUrl: override.proxy?.healthCheckUrl ?? base.proxy?.healthCheckUrl,
          failoverEnabled: override.proxy?.failoverEnabled ?? base.proxy?.failoverEnabled,
        },
        cookies: {
          enabled: override.cookies?.enabled ?? base.cookies?.enabled ?? true,
          persist: override.cookies?.persist ?? base.cookies?.persist ?? true,
          sessionTtlMs: override.cookies?.sessionTtlMs ?? base.cookies?.sessionTtlMs,
        },
        http: {
          useCookieJar: override.http?.useCookieJar ?? base.http?.useCookieJar,
        },
      } as NetworkConfig;
    }
  } catch {}
  return base;
}

function requiresNetwork(type: TaskType) {
  return (
    type === TaskType.LAUNCH_BROWSER ||
    type === TaskType.NAVIGATE_URL ||
    type === TaskType.CLICK_ELEMENT
  );
}

async function maybePoliteDelay(type: TaskType, environment: Environment, collector: LogCollector) {
  const cfg = environment.politenessConfig;
  if (!cfg || !cfg.delays.enabled) return;
  if (!requiresNetwork(type)) return;
  const ms = computeDelayMs(cfg);
  collector.info(`Politeness delay: ${ms}ms`);
  await sleep(ms);
}
