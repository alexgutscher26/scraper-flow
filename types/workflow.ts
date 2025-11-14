import { LucideProps } from "lucide-react";
import React from "react";
import { TaskParam, TaskType, TaskCategory } from "./TaskType";
import { AppNode } from "./appNode";

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export type WorkflowTask = {
  label: string;
  icon: React.FC<LucideProps>;
  type: TaskType;
  category?: TaskCategory;
  isEntryPoint?: boolean;
  inputs: TaskParam[];
  outputs: TaskParam[];
  credits: number;
  description?: string;
};

export type WorkflowExecutionPlanPhase = {
  phase: number;
  nodes: AppNode[];
  /** Optional retry policy applicable to this phase. */
  retryPolicy?: RetryPolicy;
};

export type WorkflowExecutionPlan = WorkflowExecutionPlanPhase[];

export enum WorkflowExcetionTrigger {
  MANUAL = "MANUAL",
  CRON = "CRON",
  SCHEDULED = "SCHEDULED",
}

export enum WorkflowExecutionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum ExecutionPhaseStatus {
  CREATED = "CREATED",
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Describes the backoff algorithm to use for retries.
 */
export enum BackoffStrategy {
  EXPONENTIAL = "EXPONENTIAL",
}

/**
 * Configuration for workflow-level retry policy.
 * Controls maximum attempts and delay/backoff behavior.
 */
export type RetryPolicy = {
  /** Maximum number of attempts including the first attempt. */
  maxAttempts: number;
  /** Base delay for the first retry attempt in milliseconds. */
  initialDelayMs: number;
  /** Upper bound for any computed backoff delay in milliseconds. */
  maxDelayMs: number;
  /** Multiplier used for exponential growth between attempts. */
  multiplier: number;
  /** Random jitter percentage applied to computed delay (0.0–1.0). */
  jitterPct?: number;
  /** Backoff algorithm to use. Currently only EXPONENTIAL is supported. */
  strategy: BackoffStrategy;
  /** Whether to retry executor failures. */
  retryOnFailure: boolean;
  /** Whether to retry when credits are insufficient. */
  retryOnCreditFailure?: boolean;
};

/**
 * State captured for an `ExecutionPhase` across retry attempts.
 */
export type ExecutionPhaseRetryState = {
  /** Current attempt number (starts at 1 for the first run). */
  attempt: number;
  /** Milliseconds to wait before the next attempt (if any). */
  nextBackoffMs?: number;
  /** Timestamp of last failure, if any. */
  lastFailureAt?: string;
  /** Last failure message, if available. */
  lastFailureReason?: string;
};

/**
 * Default retry policy used when a workflow does not specify overrides.
 */
export function defaultRetryPolicy(): RetryPolicy {
  return {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30_000,
    multiplier: 2,
    jitterPct: 0.2,
    strategy: BackoffStrategy.EXPONENTIAL,
    retryOnFailure: true,
    retryOnCreditFailure: false,
  };
}
