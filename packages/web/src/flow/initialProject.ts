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
      id: "input-1",
      type: "input",
      position: { x: 120, y: 260 },
      data: { label: "Input", variable: "nome", prompt: "Inserisci il tuo nome" },
    },
    {
      id: "output-1",
      type: "output",
      position: { x: 120, y: 400 },
      data: { label: "Output", expression: "nome" },
    },
    {
      id: "end",
      type: "end",
      position: { x: 120, y: 540 },
      data: { label: "End" },
    },
  ],
  edges: [
    { id: "start-input-1", source: "start", target: "input-1", data: { label: "next" } },
    { id: "input-1-output-1", source: "input-1", target: "output-1", data: { label: "next" } },
    { id: "output-1-end", source: "output-1", target: "end", data: { label: "next" } },
  ],
});
