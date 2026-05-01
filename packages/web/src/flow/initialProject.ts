import type { FlowProject } from "../types/flow";

export const createInitialProject = (): FlowProject => ({
  id: crypto.randomUUID(),
  name: "Nuovo algoritmo",
  version: 1,
  nodes: [
    {
      id: "start",
      type: "start",
      position: { x: 120, y: 120 },
      data: { label: "Start" },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 120, y: 260 },
      data: { label: "Output", expression: '"Ciao Flowit"' },
    },
    {
      id: "end",
      type: "end",
      position: { x: 120, y: 400 },
      data: { label: "End" },
    },
  ],
  edges: [
    { id: "start-output-1", source: "start", target: "output-1", data: { label: "next" } },
    { id: "output-1-end", source: "output-1", target: "end", data: { label: "next" } },
  ],
});
