import { AppNode, AppNodeMissingInputs } from '@/types/appNode';
import { WorkflowExecutionPlan, WorkflowExecutionPlanPhase, RetryPolicy } from '@/types/workflow';
import { Edge } from '@xyflow/react';
import { TaskRegistry } from './task/registry';
import { createLogger } from '@/lib/log';

export enum FlowToExecutionPlanValidationError {
  'NO_ENTRY_POINT',
  'INVALID_INPUTS',
}
type FlowToExecutionPlanType = {
  executionPlan?: WorkflowExecutionPlan;
  error?: {
    type: FlowToExecutionPlanValidationError;
    invalidElements?: AppNodeMissingInputs[];
  };
};

/**
 * Generate an execution plan for a workflow based on the provided nodes and edges.
 *
 * The function identifies the entry point of the workflow and validates inputs for each node. It constructs the execution plan in phases, ensuring that all nodes are processed while handling invalid inputs. If any node has invalid inputs, it logs the errors and returns them. The function continues until all nodes are planned or no further nodes can be added.
 *
 * @param nodes - An array of AppNode objects representing the nodes in the workflow.
 * @param edges - An array of Edge objects representing the connections between nodes.
 * @param options - Optional configuration for the execution plan, including a retry policy.
 * @returns The execution plan or an error object if validation fails.
 */
export function FlowToExecutionPlan(
  nodes: AppNode[],
  edges: Edge[],
  options?: { retryPolicy?: RetryPolicy }
): FlowToExecutionPlanType {
  const logger = createLogger('workflow/executionPlan');
  const entryPoint = nodes.find((node) => TaskRegistry[node.data.type].isEntryPoint);
  if (!entryPoint) {
    return {
      error: {
        type: FlowToExecutionPlanValidationError.NO_ENTRY_POINT,
      },
    };
  }
  const inputWithErrors: AppNodeMissingInputs[] = [];
  const planned = new Set<string>();

  const invalidInputs = getInvalidInputs(entryPoint, edges, planned);
  if (invalidInputs.length > 0) {
    inputWithErrors.push({
      nodeId: entryPoint.id,
      inputs: invalidInputs,
    });
  }
  const executionPlan: WorkflowExecutionPlan = [
    {
      phase: 1,
      nodes: [entryPoint],
      retryPolicy: options?.retryPolicy,
    },
  ];
  planned.add(entryPoint.id);
  for (let phase = 2; phase <= nodes.length && planned.size < nodes.length; phase++) {
    const nextPhase: WorkflowExecutionPlanPhase = {
      phase,
      nodes: [],
      retryPolicy: options?.retryPolicy,
    };
    for (const currentNode of nodes) {
      if (planned.has(currentNode.id)) {
        // If the node is already planned then continue
        continue;
      }
      const gate = (currentNode.data?.gate as 'AND' | 'OR' | undefined) || 'AND';
      const invalidInputs = getInvalidInputs(currentNode, edges, planned, gate);
      if (invalidInputs.length > 0) {
        const incomers = getIncomers(currentNode, nodes, edges);
        if (incomers.every((incomer: any) => planned.has(incomer.id))) {
          // If all incoming incomers/ edges are planned and there are still invalid inputs
          // this means that this particular node has an invalid input
          // which means that the workflow is invalid

          logger.error(
            `Invalid inputs found for node ${currentNode.id}: ${JSON.stringify(invalidInputs)}`
          );
          inputWithErrors.push({
            nodeId: currentNode.id,
            inputs: invalidInputs,
          });
        } else {
          continue;
        }
      }
      nextPhase.nodes.push(currentNode);
    }

    for (const node of nextPhase.nodes) {
      planned.add(node.id);
    }
    executionPlan.push(nextPhase);
  }
  if (inputWithErrors.length > 0) {
    return {
      error: {
        type: FlowToExecutionPlanValidationError.INVALID_INPUTS,
        invalidElements: inputWithErrors,
      },
    };
  }
  return { executionPlan };
}

/**
 * Retrieve a list of invalid inputs for a given node based on its connections and requirements.
 *
 * The function checks each input of the node to determine if it has a provided value. If not, it evaluates
 * the connections through edges to see if the input is linked to a valid output. Depending on the specified
 * gate ('AND' or 'OR'), it determines if the input is considered invalid based on the requirements and
 * connections to other nodes. The results are collected and returned as an array of invalid input names.
 *
 * @param node - The AppNode for which invalid inputs are being checked.
 * @param edges - An array of Edge objects representing connections between nodes.
 * @param planned - A Set of strings representing the sources of outputs that have been visited.
 * @param gate - A string that determines the logic gate to use ('AND' or 'OR').
 * @returns An array of invalid input names for the specified node.
 */
function getInvalidInputs(
  node: AppNode,
  edges: Edge[],
  planned: Set<string>,
  gate: 'AND' | 'OR' = 'AND'
) {
  const invalidInputs = [];

  const inputs = TaskRegistry[node.data.type].inputs;
  for (const input of inputs) {
    const inputValue = node.data.inputs[input.name];
    const inputValueProvided = inputValue?.length > 0;
    if (inputValueProvided) {
      continue;
    }
    // If the input value is not provided then we need to check if it is connected
    const incommingEdge = edges.filter((edge) => edge.target === node.id);
    const inputLinkedToOutput = incommingEdge.find((edge) => edge.targetHandle === input.name);
    const requiredInputProvidedByVisitedOutput =
      input.required && inputLinkedToOutput && planned.has(inputLinkedToOutput.source);

    if (gate === 'AND') {
      if (requiredInputProvidedByVisitedOutput) {
        continue;
      } else if (!input.required) {
        if (!inputLinkedToOutput) {
          continue;
        }
        if (inputLinkedToOutput && planned.has(inputLinkedToOutput.source)) {
          continue;
        }
      }
      invalidInputs.push(input.name);
    } else {
      const anySatisfied =
        requiredInputProvidedByVisitedOutput ||
        (!!inputLinkedToOutput && planned.has(inputLinkedToOutput.source));
      if (anySatisfied) {
        return [];
      }
      invalidInputs.push(input.name);
    }
  }
  return invalidInputs;
}

export const getIncomers = (node: AppNode, nodes: AppNode[], edges: Edge[]): AppNode[] => {
  if (!node.id) {
    return [];
  }
  const incomersIds = new Set();
  edges.forEach((edge) => {
    if (edge.target === node.id) {
      incomersIds.add(edge.source);
    }
  });

  return nodes.filter((n) => incomersIds.has(n.id));
};
