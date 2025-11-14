import React from 'react';
import { cn } from '@/lib/utils';
import { TaskParam } from '@/types/TaskType';
import { Handle, Position, useEdges } from '@xyflow/react';
import NodeParamField from './NodeParamField';
import { ColorForHandle } from './common';
import useFlowValidation from '@/components/hooks/useFlowValidation';

interface Props {
  input: TaskParam;
  nodeId: string;
}

function NodeInput(props: Props) {
  const { input, nodeId } = props;
  const { invalidInputs } = useFlowValidation();
  const hasErrors = invalidInputs
    .find((input) => input.nodeId === nodeId)
    ?.inputs.find((i) => i === input.name);

  const edges = useEdges();
  const isConnected = edges.some(
    (edge) => edge.target === nodeId && edge.targetHandle === input.name
  );
  return (
    <div
      className={cn(
        'relative flex w-full justify-start bg-secondary p-3',
        hasErrors && 'bg-destructive/30'
      )}
    >
      <NodeParamField param={input} nodeId={nodeId} disabled={isConnected} />
      {!input.hideHandle && (
        <Handle
          id={input.name}
          isConnectable={!isConnected}
          type="target"
          position={Position.Left}
          className={cn(
            '!-left-2 !h-4 !w-4 !border-2 !border-background !bg-muted-foreground',
            ColorForHandle[input.type]
          )}
        />
      )}
    </div>
  );
}

export default NodeInput;
