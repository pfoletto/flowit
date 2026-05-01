import type { Edge, Node } from "@xyflow/react";

export type FlowNodeKind = "start" | "end" | "assign" | "output";

export type FlowNodeData = {
  label: string;
  variable?: string;
  expression?: string;
  status?: "current" | "visited" | "invalid";
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
  visitedNodeIds: string[];
  invalidNodeIds: string[];
  variables: Record<string, number | string | boolean>;
  output: string[];
  errors: string[];
  isRunning: boolean;
};

export type ValidationIssue = {
  nodeId?: string;
  message: string;
};
