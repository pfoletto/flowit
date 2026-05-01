import type { Edge, Node } from "@xyflow/react";

export type FlowNodeKind = "start" | "end" | "input" | "assign" | "output" | "if";

export type FlowNodeData = {
  label: string;
  variable?: string;
  expression?: string;
  prompt?: string;
  status?: "current" | "visited" | "invalid";
};

export type FlowNode = Node<FlowNodeData, FlowNodeKind>;
export type FlowEdgeLabel = "next" | "true" | "false";

export type FlowEdge = Edge<{ label?: FlowEdgeLabel }>;

export type FlowProject = {
  id: string;
  name: string;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type RuntimeState = {
  currentNodeId: string | null;
  executionMode: "idle" | "run" | "step";
  visitedNodeIds: string[];
  invalidNodeIds: string[];
  pendingInput: {
    nodeId: string;
    variable: string;
    prompt: string;
  } | null;
  variables: Record<string, number | string | boolean>;
  output: string[];
  errors: string[];
  isRunning: boolean;
};

export type ValidationIssue = {
  nodeId?: string;
  message: string;
};
