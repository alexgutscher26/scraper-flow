import useFlowValidation from '@/components/hooks/useFlowValidation';
import { cn } from '@/lib/utils';
import { useReactFlow } from '@xyflow/react';
import React from 'react';

interface Props {
  nodeId: string;
  isSelected: boolean;
  children: React.ReactNode;
}
function NodeCard(props: Props) {
  const { nodeId, children, isSelected } = props;
  const { getNode, setCenter } = useReactFlow();
  const { invalidInputs } = useFlowValidation();
  const hasInvalidInputs = invalidInputs.some((input) => input.nodeId === nodeId);
  return (
    <div
      onDoubleClick={(e) => {
        const node = getNode(nodeId);
        if (!node) return;
        const { position, measured } = node;
        if (!position || !measured) return;
        const { width, height } = measured;
        const x = position.x + width! / 2;
        const y = position.y + height! / 2;
        if (x === undefined || y === undefined) return;
        setCenter(x, y, {
          zoom: 1,
          duration: 500,
        });
      }}
      className={cn(
        'flex w-[420px] border-separate cursor-pointer flex-col gap-1 rounded-md border-2 bg-background text-xs',
        isSelected && 'border-primary',
        hasInvalidInputs && 'border-2 border-destructive'
      )}
      id={nodeId}
    >
      {children}
    </div>
  );
}

export default NodeCard;
