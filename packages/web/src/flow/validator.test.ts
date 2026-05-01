import { describe, expect, it } from "vitest";
import { validateFlow } from "./validator";
import type { FlowEdge, FlowEdgeLabel, FlowNode, FlowNodeKind } from "../types/flow";

const node = (
  id: string,
  type: FlowNodeKind,
  data: FlowNode["data"] = { label: id },
): FlowNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { ...data, label: data.label ?? id },
});

const edge = (source: string, target: string, label: FlowEdgeLabel = "next"): FlowEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  label: label === "next" ? undefined : label,
  data: { label },
});

const validLinearFlow = () => {
  const nodes = [
    node("start", "start", { label: "Start" }),
    node("assign", "assign", { label: "Assignment", variable: "x", expression: "1" }),
    node("output", "output", { label: "Output", expression: "x" }),
    node("end", "end", { label: "End" }),
  ];

  return {
    nodes,
    edges: [edge("start", "assign"), edge("assign", "output"), edge("output", "end")],
  };
};

describe("validateFlow", () => {
  it("accepts a valid linear flow", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, edges)).toEqual([]);
  });

  it("reports a missing Start node", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes.filter((item) => item.type !== "start"), edges)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Manca il blocco Start." })]),
    );
  });

  it("reports more than one Start node", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow([...nodes, node("start-2", "start")], edges).some((issue) => issue.message.includes("un solo Start"))).toBe(true);
  });

  it("reports a missing End node", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes.filter((item) => item.type !== "end"), edges).some((issue) => issue.message.includes("Manca almeno"))).toBe(true);
  });

  it("reports an edge with a missing source", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("ghost", "end")]).some((issue) => issue.message.includes("origine inesistente"))).toBe(true);
  });

  it("reports an edge with a missing target", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("start", "ghost")]).some((issue) => issue.message.includes("nodo inesistente"))).toBe(true);
  });

  it("reports an incoming edge into Start", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("end", "start")]).some((issue) => issue.message.includes("ingresso"))).toBe(true);
  });

  it("reports a non-Start node with no incoming edge", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, edges.filter((item) => item.target !== "output")).some((issue) => issue.message.includes("non e' raggiunto"))).toBe(true);
  });

  it("reports an outgoing edge from End", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("end", "output")]).some((issue) => issue.message.includes("uscita"))).toBe(true);
  });

  it("reports a non-End node with no outgoing edge", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, edges.filter((item) => item.source !== "output")).some((issue) => issue.message.includes("deve avere"))).toBe(true);
  });

  it("reports multiple outgoing edges in the MVP runtime", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("assign", "end")]).some((issue) => issue.message.includes("piu' di un"))).toBe(true);
  });

  it("reports an assignment without variable", () => {
    const { nodes, edges } = validLinearFlow();
    const nextNodes = nodes.map((item) => (item.id === "assign" ? { ...item, data: { label: "Assignment", expression: "1" } } : item));

    expect(validateFlow(nextNodes, edges).some((issue) => issue.message.includes("richiede una variabile"))).toBe(true);
  });

  it("reports an assignment without expression", () => {
    const { nodes, edges } = validLinearFlow();
    const nextNodes = nodes.map((item) => (item.id === "assign" ? { ...item, data: { label: "Assignment", variable: "x" } } : item));

    expect(validateFlow(nextNodes, edges).some((issue) => issue.message.includes("richiede un'espressione"))).toBe(true);
  });

  it("reports an output without expression", () => {
    const { nodes, edges } = validLinearFlow();
    const nextNodes = nodes.map((item) => (item.id === "output" ? { ...item, data: { label: "Output" } } : item));

    expect(validateFlow(nextNodes, edges).some((issue) => issue.message.includes("output"))).toBe(true);
  });

  it("accepts an input node with a variable", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("input", "input", { label: "Input", variable: "name", prompt: "Name?" }),
      node("end", "end", { label: "End" }),
    ];

    expect(validateFlow(nodes, [edge("start", "input"), edge("input", "end")])).toEqual([]);
  });

  it("reports an input without variable", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("input", "input", { label: "Input", prompt: "Name?" }),
      node("end", "end", { label: "End" }),
    ];

    expect(validateFlow(nodes, [edge("start", "input"), edge("input", "end")]).some((issue) => issue.message.includes("variabile di input"))).toBe(true);
  });

  it("accepts an If node with true and false branches", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"positive"' }),
      node("false-output", "output", { label: "False", expression: '"other"' }),
      node("end", "end", { label: "End" }),
    ];
    const edges = [
      edge("start", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    expect(validateFlow(nodes, edges)).toEqual([]);
  });

  it("reports an If node without condition", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("if", "if", { label: "If" }),
      node("true-output", "output", { label: "True", expression: '"positive"' }),
      node("false-output", "output", { label: "False", expression: '"other"' }),
      node("end", "end", { label: "End" }),
    ];
    const edges = [
      edge("start", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    expect(validateFlow(nodes, edges).some((issue) => issue.message.includes("condizione"))).toBe(true);
  });

  it("reports an If node without true branch", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("false-output", "output", { label: "False", expression: '"other"' }),
      node("end", "end", { label: "End" }),
    ];
    const edges = [edge("start", "if"), edge("if", "false-output", "false"), edge("false-output", "end")];

    expect(validateFlow(nodes, edges).some((issue) => issue.message.includes("uscita true"))).toBe(true);
  });

  it("reports an If node without false branch", () => {
    const nodes = [
      node("start", "start", { label: "Start" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"positive"' }),
      node("end", "end", { label: "End" }),
    ];
    const edges = [edge("start", "if"), edge("if", "true-output", "true"), edge("true-output", "end")];

    expect(validateFlow(nodes, edges).some((issue) => issue.message.includes("uscita false"))).toBe(true);
  });

  it("reports an unreachable node", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow([...nodes, node("unused", "output", { label: "Unused", expression: '"x"' })], edges).some((issue) => issue.message.includes("raggiungibile"))).toBe(true);
  });

  it("reports a cycle", () => {
    const { nodes, edges } = validLinearFlow();

    expect(validateFlow(nodes, [...edges, edge("output", "assign")]).some((issue) => issue.message.includes("ciclo"))).toBe(true);
  });
});
