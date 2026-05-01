import { describe, expect, it } from "vitest";
import { runLinearFlow } from "./interpreter";
import type { FlowEdge, FlowNode, FlowNodeKind } from "../types/flow";

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

const edge = (source: string, target: string): FlowEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  data: { label: "next" },
});

const run = (middleNodes: FlowNode[], middleEdges: FlowEdge[]) =>
  runLinearFlow(
    [node("start", "start"), ...middleNodes, node("end", "end")],
    [edge("start", middleNodes[0]?.id ?? "end"), ...middleEdges, ...(middleNodes.length > 0 ? [edge(middleNodes[middleNodes.length - 1].id, "end")] : [])],
  );

describe("runLinearFlow", () => {
  it("runs a Start to End flow", () => {
    const result = runLinearFlow([node("start", "start"), node("end", "end")], [edge("start", "end")]);

    expect(result.errors).toEqual([]);
    expect(result.visitedNodeIds).toEqual(["start", "end"]);
  });

  it("outputs a string literal", () => {
    const result = run([node("out", "output", { label: "Output", expression: '"hello"' })], []);

    expect(result.output).toEqual(["hello"]);
  });

  it("assigns and outputs a numeric value", () => {
    const result = run(
      [
        node("assign", "assign", { label: "Assignment", variable: "x", expression: "7" }),
        node("out", "output", { label: "Output", expression: "x" }),
      ],
      [edge("assign", "out")],
    );

    expect(result.output).toEqual(["7"]);
  });

  it("evaluates arithmetic expressions", () => {
    const result = run([node("out", "output", { label: "Output", expression: "2 + 3 * 4" })], []);

    expect(result.output).toEqual(["14"]);
  });

  it("uses previous variables in later assignments", () => {
    const result = run(
      [
        node("a", "assign", { label: "A", variable: "x", expression: "2" }),
        node("b", "assign", { label: "B", variable: "y", expression: "x + 5" }),
        node("out", "output", { label: "Output", expression: "y" }),
      ],
      [edge("a", "b"), edge("b", "out")],
    );

    expect(result.variables.y).toBe(7);
    expect(result.output).toEqual(["7"]);
  });

  it("overwrites an existing variable", () => {
    const result = run(
      [
        node("a", "assign", { label: "A", variable: "x", expression: "1" }),
        node("b", "assign", { label: "B", variable: "x", expression: "x + 1" }),
        node("out", "output", { label: "Output", expression: "x" }),
      ],
      [edge("a", "b"), edge("b", "out")],
    );

    expect(result.variables.x).toBe(2);
  });

  it("records the last current node", () => {
    const result = run([node("out", "output", { label: "Output", expression: '"done"' })], []);

    expect(result.currentNodeId).toBe("end");
  });

  it("returns an error when Start is missing", () => {
    const result = runLinearFlow([node("end", "end")], []);

    expect(result.errors).toEqual(["Manca il blocco Start."]);
  });

  it("returns an error for incomplete assignment", () => {
    const result = run([node("assign", "assign", { label: "Assignment", expression: "1" })], []);

    expect(result.errors.some((message) => message.includes("Assignment incompleto"))).toBe(true);
  });

  it("returns an error for incomplete output", () => {
    const result = run([node("out", "output", { label: "Output" })], []);

    expect(result.errors.some((message) => message.includes("Output incompleto"))).toBe(true);
  });

  it("returns an error for invalid assignment expression", () => {
    const result = run([node("assign", "assign", { label: "Assignment", variable: "x", expression: "unknown + 1" })], []);

    expect(result.errors.some((message) => message.includes("Errore in Assignment"))).toBe(true);
    expect(result.invalidNodeIds).toContain("assign");
  });

  it("returns an error for invalid output expression", () => {
    const result = run([node("out", "output", { label: "Output", expression: "unknown + 1" })], []);

    expect(result.errors.some((message) => message.includes("Errore in Output"))).toBe(true);
    expect(result.invalidNodeIds).toContain("out");
  });

  it("returns an error when a non-End node has no outgoing edge", () => {
    const result = runLinearFlow([node("start", "start")], []);

    expect(result.errors.some((message) => message.includes("non ha un collegamento"))).toBe(true);
    expect(result.invalidNodeIds).toContain("start");
  });

  it("returns an error when an edge points to a missing node", () => {
    const result = runLinearFlow([node("start", "start")], [edge("start", "ghost")]);

    expect(result.errors.some((message) => message.includes("nodo inesistente"))).toBe(true);
    expect(result.invalidNodeIds).toContain("ghost");
  });

  it("stops runaway flows at the step limit", () => {
    const result = runLinearFlow([node("start", "start")], [edge("start", "start")]);

    expect(result.errors.some((message) => message.includes("500 step"))).toBe(true);
  });
});
