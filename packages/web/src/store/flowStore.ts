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
import { continueLinearFlow, continueStepFlow, runLinearFlow, stepLinearFlow } from "../runtime/interpreter";
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
  stepProject: () => void;
  submitRuntimeInput: (value: string) => void;
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
  executionMode: "idle",
  visitedNodeIds: [],
  invalidNodeIds: [],
  pendingInput: null,
  variables: {},
  output: [],
  errors: [],
  isRunning: false,
});

const nodeDefaults: Record<FlowNodeKind, FlowNode["data"]> = {
  start: { label: "Start" },
  end: { label: "End" },
  input: { label: "Input", variable: "x", prompt: "Inserisci un valore" },
  assign: { label: "Assignment", variable: "x", expression: "1" },
  output: { label: "Output", expression: "x" },
  if: { label: "If", expression: "x > 0" },
};

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

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
        edges: addEdge(
          {
            ...connection,
            label: connection.sourceHandle === "true" ? "true" : connection.sourceHandle === "false" ? "false" : undefined,
            data: {
              label: connection.sourceHandle === "true" ? "true" : connection.sourceHandle === "false" ? "false" : "next",
            },
          },
          state.project.edges,
        ),
      },
    })),

  addNode: (kind) =>
    set((state) => {
      if (kind === "if") {
        const ifId = createId("if");
        const trueOutputId = createId("output-true");
        const falseOutputId = createId("output-false");
        const endId = createId("end-if");
        const baseX = 260 + state.project.nodes.length * 18;
        const baseY = 160 + state.project.nodes.length * 18;
        const nextNodes: FlowNode[] = [
          {
            id: ifId,
            type: "if",
            position: { x: baseX, y: baseY },
            data: { ...nodeDefaults.if },
          },
          {
            id: trueOutputId,
            type: "output",
            position: { x: baseX + 260, y: baseY + 180 },
            data: { label: "Output true", expression: '"ramo true"' },
          },
          {
            id: falseOutputId,
            type: "output",
            position: { x: baseX - 260, y: baseY + 180 },
            data: { label: "Output false", expression: '"ramo false"' },
          },
          {
            id: endId,
            type: "end",
            position: { x: baseX, y: baseY + 360 },
            data: { label: "End" },
          },
        ];
        const nextEdges: FlowEdge[] = [
          {
            id: `${ifId}-${trueOutputId}`,
            source: ifId,
            sourceHandle: "true",
            target: trueOutputId,
            label: "true",
            data: { label: "true" },
          },
          {
            id: `${ifId}-${falseOutputId}`,
            source: ifId,
            sourceHandle: "false",
            target: falseOutputId,
            label: "false",
            data: { label: "false" },
          },
          {
            id: `${trueOutputId}-${endId}`,
            source: trueOutputId,
            target: endId,
            data: { label: "next" },
          },
          {
            id: `${falseOutputId}-${endId}`,
            source: falseOutputId,
            target: endId,
            data: { label: "next" },
          },
        ];

        return {
          project: {
            ...state.project,
            nodes: [...state.project.nodes, ...nextNodes],
            edges: [...state.project.edges, ...nextEdges],
          },
          selectedNodeId: ifId,
        };
      }

      const id = createId(kind);
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

  stepProject: () => {
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

    set({ runtime: stepLinearFlow(nodes, edges, get().runtime) });
  },

  submitRuntimeInput: (value) => {
    const { nodes, edges } = get().project;
    const runtime = get().runtime;

    set({
      runtime:
        runtime.executionMode === "step"
          ? continueStepFlow(nodes, edges, runtime, value)
          : continueLinearFlow(nodes, edges, runtime, value),
    });
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
