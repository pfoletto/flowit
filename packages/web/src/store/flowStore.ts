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
import { getInvalidNodeIds, validateFlow } from "../flow/validator";
import { runLinearFlow } from "../runtime/interpreter";
import type { FlowEdge, FlowNode, FlowNodeKind, FlowProject, RuntimeState } from "../types/flow";

type FlowStore = {
  project: FlowProject;
  selectedNodeId: string | null;
  runtime: RuntimeState;
  updateProjectName: (name: string) => void;
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
  exportProject: () => void;
  importProject: (project: FlowProject) => void;
  setRuntimeErrors: (errors: string[]) => void;
};

const storageKey = "flowit.project.v1";

const createRuntime = (): RuntimeState => ({
  currentNodeId: null,
  visitedNodeIds: [],
  invalidNodeIds: [],
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

  updateProjectName: (name) =>
    set((state) => ({
      project: {
        ...state.project,
        name,
      },
    })),

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
    const validationIssues = validateFlow(nodes, edges);

    if (validationIssues.length > 0) {
      set({
        runtime: {
          ...createRuntime(),
          invalidNodeIds: getInvalidNodeIds(validationIssues),
          errors: validationIssues.map((issue) => issue.message),
        },
      });
      return;
    }

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

  exportProject: () => {
    const project = get().project;
    const file = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}.flowit.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importProject: (project) => {
    set({ project, selectedNodeId: null, runtime: createRuntime() });
  },

  setRuntimeErrors: (errors) => {
    set({ runtime: { ...createRuntime(), errors } });
  },
}));
