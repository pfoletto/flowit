import type { Edge, Node } from "@xyflow/react";

export type FlowNodeKind = "start" | "end" | "assign" | "output";

export type FlowNodeData = {
  label: string;
  variable?: string;
  expression?: string;
};

export type FlowNode = Node<FlowNodeData, FlowNodeKind>;
export type FlowEdge = Edge<{ label?: "next" }>;

export type FlowProject = {
  id: string;
  name: string;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type RuntimeState = {
  currentNodeId: string | null;
  variables: Record<string, number | string | boolean>;
  output: string[];
  errors: string[];
  isRunning: boolean;
};
