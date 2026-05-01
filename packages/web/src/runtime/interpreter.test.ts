import { describe, expect, it } from "vitest";
import { continueLinearFlow, continueStepFlow, runLinearFlow, stepLinearFlow } from "./interpreter";
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

const run = (
  middleNodes: FlowNode[],
  middleEdges: FlowEdge[],
  options?: Parameters<typeof runLinearFlow>[2],
) =>
  runLinearFlow(
    [node("start", "start"), ...middleNodes, node("end", "end")],
    [edge("start", middleNodes[0]?.id ?? "end"), ...middleEdges, ...(middleNodes.length > 0 ? [edge(middleNodes[middleNodes.length - 1].id, "end")] : [])],
    options,
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

  it("stores an input value in the selected variable", () => {
    const result = run(
      [
        node("input", "input", { label: "Input", variable: "name", prompt: "Name?" }),
        node("out", "output", { label: "Output", expression: "name" }),
      ],
      [edge("input", "out")],
      { readInput: () => "Ada" },
    );

    expect(result.variables.name).toBe("Ada");
    expect(result.output).toEqual(["Ada"]);
  });

  it("pauses when input is required and no reader is provided", () => {
    const result = run(
      [
        node("input", "input", { label: "Input", variable: "name", prompt: "Name?" }),
        node("out", "output", { label: "Output", expression: "name" }),
      ],
      [edge("input", "out")],
    );

    expect(result.isRunning).toBe(true);
    expect(result.pendingInput).toEqual({ nodeId: "input", variable: "name", prompt: "Name?" });
    expect(result.currentNodeId).toBe("input");
  });

  it("continues after submitting a pending input value", () => {
    const nodes = [
      node("start", "start"),
      node("input", "input", { label: "Input", variable: "name", prompt: "Name?" }),
      node("out", "output", { label: "Output", expression: "name" }),
      node("end", "end"),
    ];
    const edges = [edge("start", "input"), edge("input", "out"), edge("out", "end")];
    const paused = runLinearFlow(nodes, edges);
    const result = continueLinearFlow(nodes, edges, paused, "Ada");

    expect(result.isRunning).toBe(false);
    expect(result.pendingInput).toBeNull();
    expect(result.variables.name).toBe("Ada");
    expect(result.output).toEqual(["Ada"]);
    expect(result.currentNodeId).toBe("end");
  });

  it("passes prompt and variable name to the input reader", () => {
    let receivedPrompt = "";
    let receivedVariable = "";

    run([node("input", "input", { label: "Input", variable: "age", prompt: "Age?" })], [], {
      readInput: (prompt, variable) => {
        receivedPrompt = prompt;
        receivedVariable = variable;
        return 42;
      },
    });

    expect(receivedPrompt).toBe("Age?");
    expect(receivedVariable).toBe("age");
  });

  it("returns an error for incomplete input", () => {
    const result = run([node("input", "input", { label: "Input", prompt: "Name?" })], []);

    expect(result.errors.some((message) => message.includes("Input incompleto"))).toBe(true);
    expect(result.invalidNodeIds).toContain("input");
  });

  it("runs the true branch of an If node", () => {
    const nodes = [
      node("start", "start"),
      node("assign", "assign", { label: "Assignment", variable: "x", expression: "3" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"positive"' }),
      node("false-output", "output", { label: "False", expression: '"other"' }),
      node("end", "end"),
    ];
    const edges = [
      edge("start", "assign"),
      edge("assign", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    const result = runLinearFlow(nodes, edges);

    expect(result.output).toEqual(["positive"]);
    expect(result.visitedNodeIds).toEqual(["start", "assign", "if", "true-output", "end"]);
  });

  it("runs the false branch of an If node", () => {
    const nodes = [
      node("start", "start"),
      node("assign", "assign", { label: "Assignment", variable: "x", expression: "-1" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"positive"' }),
      node("false-output", "output", { label: "False", expression: '"other"' }),
      node("end", "end"),
    ];
    const edges = [
      edge("start", "assign"),
      edge("assign", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    const result = runLinearFlow(nodes, edges);

    expect(result.output).toEqual(["other"]);
    expect(result.visitedNodeIds).toEqual(["start", "assign", "if", "false-output", "end"]);
  });

  it("returns an error for invalid If condition", () => {
    const result = run(
      [
        node("if", "if", { label: "If", expression: "unknown > 0" }),
        node("out", "output", { label: "Output", expression: '"done"' }),
      ],
      [edge("if", "out", "true"), edge("if", "out", "false")],
    );

    expect(result.errors.some((message) => message.includes("Errore in If"))).toBe(true);
    expect(result.invalidNodeIds).toContain("if");
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

  it("steps through assignment and output", () => {
    const nodes = [
      node("start", "start"),
      node("assign", "assign", { label: "Assignment", variable: "x", expression: "9" }),
      node("out", "output", { label: "Output", expression: "x" }),
      node("end", "end"),
    ];
    const edges = [edge("start", "assign"), edge("assign", "out"), edge("out", "end")];

    const afterStart = stepLinearFlow(nodes, edges);
    const afterAssign = stepLinearFlow(nodes, edges, afterStart);
    const afterOutput = stepLinearFlow(nodes, edges, afterAssign);

    expect(afterStart.currentNodeId).toBe("assign");
    expect(afterAssign.variables.x).toBe(9);
    expect(afterAssign.currentNodeId).toBe("out");
    expect(afterOutput.output).toEqual(["9"]);
    expect(afterOutput.currentNodeId).toBe("end");
  });

  it("steps into pending input and continues after submit", () => {
    const nodes = [
      node("start", "start"),
      node("input", "input", { label: "Input", variable: "name", prompt: "Name?" }),
      node("out", "output", { label: "Output", expression: "name" }),
      node("end", "end"),
    ];
    const edges = [edge("start", "input"), edge("input", "out"), edge("out", "end")];

    const afterStart = stepLinearFlow(nodes, edges);
    const waitingInput = stepLinearFlow(nodes, edges, afterStart);
    const afterInput = continueStepFlow(nodes, edges, waitingInput, "Ada");

    expect(waitingInput.pendingInput).toEqual({ nodeId: "input", variable: "name", prompt: "Name?" });
    expect(afterInput.variables.name).toBe("Ada");
    expect(afterInput.currentNodeId).toBe("out");
    expect(afterInput.output).toEqual([]);
  });

  it("steps through the true branch of an If node", () => {
    const nodes = [
      node("start", "start"),
      node("assign", "assign", { label: "Assignment", variable: "x", expression: "1" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"true"' }),
      node("false-output", "output", { label: "False", expression: '"false"' }),
      node("end", "end"),
    ];
    const edges = [
      edge("start", "assign"),
      edge("assign", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    const afterStart = stepLinearFlow(nodes, edges);
    const afterAssign = stepLinearFlow(nodes, edges, afterStart);
    const afterIf = stepLinearFlow(nodes, edges, afterAssign);

    expect(afterIf.currentNodeId).toBe("true-output");
    expect(afterIf.visitedNodeIds).toEqual(["start", "assign", "if"]);
  });

  it("steps through the false branch of an If node", () => {
    const nodes = [
      node("start", "start"),
      node("assign", "assign", { label: "Assignment", variable: "x", expression: "-1" }),
      node("if", "if", { label: "If", expression: "x > 0" }),
      node("true-output", "output", { label: "True", expression: '"true"' }),
      node("false-output", "output", { label: "False", expression: '"false"' }),
      node("end", "end"),
    ];
    const edges = [
      edge("start", "assign"),
      edge("assign", "if"),
      edge("if", "true-output", "true"),
      edge("if", "false-output", "false"),
      edge("true-output", "end"),
      edge("false-output", "end"),
    ];

    const afterStart = stepLinearFlow(nodes, edges);
    const afterAssign = stepLinearFlow(nodes, edges, afterStart);
    const afterIf = stepLinearFlow(nodes, edges, afterAssign);

    expect(afterIf.currentNodeId).toBe("false-output");
    expect(afterIf.visitedNodeIds).toEqual(["start", "assign", "if"]);
  });
});
