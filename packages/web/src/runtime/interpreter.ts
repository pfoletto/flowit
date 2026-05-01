import { Parser } from "expr-eval";
import type { FlowEdge, FlowNode, RuntimeState } from "../types/flow";

const parser = new Parser();

const evaluateExpression = (expression: string, variables: RuntimeState["variables"]) =>
  parser.evaluate(expression, variables as Parameters<typeof parser.evaluate>[1]);

const initialRuntime = (): RuntimeState => ({
  currentNodeId: null,
  variables: {},
  output: [],
  errors: [],
  isRunning: false,
});

export const runLinearFlow = (nodes: FlowNode[], edges: FlowEdge[]): RuntimeState => {
  const runtime = initialRuntime();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const startNode = nodes.find((node) => node.type === "start");

  if (!startNode) {
    return { ...runtime, errors: ["Manca il blocco Start."] };
  }

  let current: FlowNode | undefined = startNode;
  const visitedSteps = new Set<string>();
  let stepCount = 0;

  while (current) {
    runtime.currentNodeId = current.id;
    stepCount += 1;

    if (stepCount > 500) {
      runtime.errors.push("Esecuzione interrotta: limite massimo di 500 step raggiunto.");
      break;
    }

    if (visitedSteps.has(`${current.id}:${stepCount}`)) {
      runtime.errors.push("Esecuzione interrotta: possibile ciclo non gestito nel runtime MVP.");
      break;
    }

    if (current.type === "end") {
      break;
    }

    if (current.type === "assign") {
      const variable = current.data.variable?.trim();
      const expression = current.data.expression?.trim();

      if (!variable || !expression) {
        runtime.errors.push(`Assignment incompleto nel blocco "${current.data.label}".`);
        break;
      }

      runtime.variables[variable] = evaluateExpression(expression, runtime.variables);
    }

    if (current.type === "output") {
      const expression = current.data.expression?.trim();

      if (!expression) {
        runtime.errors.push(`Output incompleto nel blocco "${current.data.label}".`);
        break;
      }

      runtime.output.push(String(evaluateExpression(expression, runtime.variables)));
    }

    const nextEdge = edges.find((edge) => edge.source === current?.id);

    if (!nextEdge) {
      runtime.errors.push(`Il blocco "${current.data.label}" non ha un collegamento in uscita.`);
      break;
    }

    current = nodeById.get(nextEdge.target);

    if (!current) {
      runtime.errors.push(`Collegamento verso nodo inesistente: ${nextEdge.target}.`);
      break;
    }
  }

  runtime.isRunning = false;
  return runtime;
};
