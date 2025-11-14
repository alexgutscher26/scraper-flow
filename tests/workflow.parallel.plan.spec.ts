import { describe, it, expect } from 'vitest';
import { FlowToExecutionPlan } from '@/lib/workflow/executionPlan';
import { AppNode } from '@/types/appNode';
import { Edge } from '@xyflow/react';
import { TaskType } from '@/types/TaskType';

const mkNode = (id: string, type: TaskType, inputs: Record<string, string> = {}, extra: any = {}) =>
  ({
    id,
    type: 'Node',
    position: { x: 0, y: 0 },
    data: { type, inputs, ...extra },
  }) as unknown as AppNode;

describe('FlowToExecutionPlan parallel phases', () => {
  it('groups nodes into concurrent phases when dependencies allow', () => {
    const entry = mkNode('A', TaskType.LAUNCH_BROWSER, { 'Website Url': 'https://ex.com' });
    const p1 = mkNode('B', TaskType.PAGE_TO_HTML, {});
    const p2 = mkNode('C', TaskType.PAGE_TO_HTML, {});
    const nodes = [entry, p1, p2];
    const edges: Edge[] = [
      {
        id: 'e1',
        source: 'A',
        target: 'B',
        sourceHandle: 'Web page',
        targetHandle: 'Web page',
      } as any,
      {
        id: 'e2',
        source: 'A',
        target: 'C',
        sourceHandle: 'Web page',
        targetHandle: 'Web page',
      } as any,
    ];
    const res = FlowToExecutionPlan(nodes, edges);
    expect(res.error).toBeUndefined();
    expect(res.executionPlan?.length).toBeGreaterThanOrEqual(2);
    const phase2 = res.executionPlan?.find((p) => p.phase === 2);
    expect(phase2?.nodes.map((n) => n.id).sort()).toEqual(['B', 'C']);
  });

  it('applies AND gate requiring all inputs', () => {
    const entry = mkNode('A', TaskType.LAUNCH_BROWSER, { 'Website Url': 'https://ex.com' });
    const html = mkNode('B', TaskType.PAGE_TO_HTML, {});
    const read = mkNode('C', TaskType.READ_PROPERTY_FROM_JSON, {}, { gate: 'AND' });
    const nodes = [entry, html, read];
    const edges: Edge[] = [
      {
        id: 'e1',
        source: 'A',
        target: 'B',
        sourceHandle: 'Web page',
        targetHandle: 'Web page',
      } as any,
      { id: 'e2', source: 'B', target: 'C', sourceHandle: 'Html', targetHandle: 'JSON' } as any,
    ];
    const res = FlowToExecutionPlan(nodes, edges);
    expect(res.error?.type).toBeDefined();
  });

  it('applies OR gate allowing any satisfied input to proceed', () => {
    const entry = mkNode('A', TaskType.LAUNCH_BROWSER, { 'Website Url': 'https://ex.com' });
    const html = mkNode('B', TaskType.PAGE_TO_HTML, {});
    const read = mkNode('C', TaskType.READ_PROPERTY_FROM_JSON, {}, { gate: 'OR' });
    const nodes = [entry, html, read];
    const edges: Edge[] = [
      {
        id: 'e1',
        source: 'A',
        target: 'B',
        sourceHandle: 'Web page',
        targetHandle: 'Web page',
      } as any,
      { id: 'e2', source: 'B', target: 'C', sourceHandle: 'Html', targetHandle: 'JSON' } as any,
    ];
    const res = FlowToExecutionPlan(nodes, edges);
    expect(res.error).toBeUndefined();
    const phase3 = res.executionPlan?.find((p) => p.phase === 3);
    expect(phase3?.nodes.some((n) => n.id === 'C')).toBe(true);
  });
});
