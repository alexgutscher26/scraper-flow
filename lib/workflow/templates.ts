import { Edge } from '@xyflow/react';
import { CreateFlowNode } from '@/lib/workflow/createFlowNode';
import { AppNode } from '@/types/appNode';
import { TaskType } from '@/types/TaskType';

export type WorkflowTemplateKey = 'example_html' | 'example_screenshot' | 'comprehensive_capture';

export function buildTemplate(
  key: WorkflowTemplateKey,
  websiteUrl?: string
): { nodes: AppNode[]; edges: Edge[] } {
  const url = websiteUrl || 'https://example.com';
  if (key === 'example_html') {
    const n1 = CreateFlowNode(TaskType.LAUNCH_BROWSER, { x: 0, y: 0 });
    n1.data.inputs['Website Url'] = url;
    const n2 = CreateFlowNode(TaskType.PAGE_TO_HTML, { x: 300, y: 0 });
    const e1: Edge = {
      id: crypto.randomUUID(),
      source: n1.id,
      target: n2.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    return { nodes: [n1, n2], edges: [e1] };
  }
  if (key === 'example_screenshot') {
    const n1 = CreateFlowNode(TaskType.LAUNCH_BROWSER, { x: 0, y: 0 });
    n1.data.inputs['Website Url'] = url;
    const n2 = CreateFlowNode(TaskType.TAKE_SCREENSHOT, { x: 300, y: 0 });
    n2.data.inputs['Full page'] = 'true';
    n2.data.inputs['Screenshot name'] = 'example';
    n2.data.inputs['Quality'] = '90';
    const e1: Edge = {
      id: crypto.randomUUID(),
      source: n1.id,
      target: n2.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    return { nodes: [n1, n2], edges: [e1] };
  }
  if (key === 'comprehensive_capture') {
    const n1 = CreateFlowNode(TaskType.LAUNCH_BROWSER, { x: 0, y: 0 });
    n1.data.inputs['Website Url'] = url;
    const n2 = CreateFlowNode(TaskType.WAIT_FOR_ELEMENT, { x: 280, y: -100 });
    n2.data.inputs['Selector'] = 'body';
    n2.data.inputs['Visibility'] = 'visible';
    const n3 = CreateFlowNode(TaskType.EXTRACT_LINKS_FROM_PAGE, { x: 560, y: -140 });
    const n4 = CreateFlowNode(TaskType.PAGE_TO_HTML, { x: 560, y: 40 });
    const n5 = CreateFlowNode(TaskType.EXTRACT_TEXT_FROM_ELEMENT, { x: 820, y: 40 });
    n5.data.inputs['Selector'] = 'h1';
    const n6 = CreateFlowNode(TaskType.TAKE_SCREENSHOT, { x: 820, y: -140 });
    n6.data.inputs['Full page'] = 'true';
    n6.data.inputs['Screenshot name'] = 'page';
    n6.data.inputs['Quality'] = '90';
    const n7 = CreateFlowNode(TaskType.DELIVER_VIA_WEBHOOK, { x: 1060, y: -140 });
    n7.data.inputs['Target URL'] = 'https://httpbin.org/post';
    n7.data.inputs['Body'] = '{"status":"ok","note":"sample payload"}';
    const e1: Edge = {
      id: crypto.randomUUID(),
      source: n1.id,
      target: n2.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    const e2: Edge = {
      id: crypto.randomUUID(),
      source: n2.id,
      target: n3.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    const e3: Edge = {
      id: crypto.randomUUID(),
      source: n2.id,
      target: n4.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    const e4: Edge = {
      id: crypto.randomUUID(),
      source: n4.id,
      target: n5.id,
      sourceHandle: 'Html',
      targetHandle: 'Html',
    };
    const e5: Edge = {
      id: crypto.randomUUID(),
      source: n2.id,
      target: n6.id,
      sourceHandle: 'Web page',
      targetHandle: 'Web page',
    };
    return { nodes: [n1, n2, n3, n4, n5, n6, n7], edges: [e1, e2, e3, e4, e5] };
  }
  const n1 = CreateFlowNode(TaskType.LAUNCH_BROWSER, { x: 0, y: 0 });
  n1.data.inputs['Website Url'] = url;
  return { nodes: [n1], edges: [] };
}

export function templateCredits(key: WorkflowTemplateKey): number {
  if (key === 'example_html') return 5 + 2;
  if (key === 'example_screenshot') return 5 + 3;
  if (key === 'comprehensive_capture') return 5 + 1 + 1 + 2 + 2 + 3 + 1;
  return 5;
}
