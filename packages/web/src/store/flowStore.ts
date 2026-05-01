import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import { createInitialProject } from "../flow/initialProject";
import { runLinearFlow } from "../runtime/interpreter";
import type { FlowEdge, FlowNode, FlowNodeKind, FlowProject, RuntimeState } from "../types/flow";

type FlowStore = {
  project: FlowProject;
  selectedNodeId: string | null;
  runtime: RuntimeState;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (kind: FlowNodeKind) => void;
  selectNode: (nodeId: string | null) => void;
  updateSelectedNode: (data: Partial<FlowNode["data"]>) => void;
  runProject: () => void;
  resetRuntime: () => void;
  newProject: () => void;
  saveProject: () => void;
  loadProject: () => void;
};

const storageKey = "flowit.project.v1";

const createRuntime = (): RuntimeState => ({
  currentNodeId: null,
  variables: {},
  output: [],
  errors: [],
  isRunning: false,
});

const nodeDefaults: Record<FlowNodeKind, FlowNode["data"]> = {
  start: { label: "Start" },
  end: { label: "End" },
  assign: { label: "Assignment", variable: "x", expression: "1" },
  output: { label: "Output", expression: "x" },
};

export const useFlowStore = create<FlowStore>((set, get) => ({
  project: createInitialProject(),
  selectedNodeId: null,
  runtime: createRuntime(),

  onNodesChange: (changes) =>
    set((state) => ({
      project: {
        ...state.project,
        nodes: applyNodeChanges(changes, state.project.nodes),
      },
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      project: {
        ...state.project,
        edges: applyEdgeChanges(changes, state.project.edges),
      },
    })),

  onConnect: (connection) =>
    set((state) => ({
      project: {
        ...state.project,
        edges: addEdge({ ...connection, data: { label: "next" } }, state.project.edges),
      },
    })),

  addNode: (kind) =>
    set((state) => {
      const id = `${kind}-${crypto.randomUUID().slice(0, 8)}`;
      const nextNode: FlowNode = {
        id,
        type: kind,
        position: { x: 240 + state.project.nodes.length * 18, y: 160 + state.project.nodes.length * 18 },
        data: { ...nodeDefaults[kind] },
      };

      return {
        project: {
          ...state.project,
          nodes: [...state.project.nodes, nextNode],
        },
        selectedNodeId: id,
      };
    }),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  updateSelectedNode: (data) =>
    set((state) => ({
      project: {
        ...state.project,
        nodes: state.project.nodes.map((node) =>
          node.id === state.selectedNodeId ? { ...node, data: { ...node.data, ...data } } : node,
        ),
      },
    })),

  runProject: () => {
    const { nodes, edges } = get().project;
    set({ runtime: runLinearFlow(nodes, edges) });
  },

  resetRuntime: () => set({ runtime: createRuntime() }),

  newProject: () => set({ project: createInitialProject(), selectedNodeId: null, runtime: createRuntime() }),

  saveProject: () => {
    localStorage.setItem(storageKey, JSON.stringify(get().project));
  },

  loadProject: () => {
    const storedProject = localStorage.getItem(storageKey);
    if (!storedProject) {
      return;
    }

    set({ project: JSON.parse(storedProject) as FlowProject, selectedNodeId: null, runtime: createRuntime() });
  },
}));
