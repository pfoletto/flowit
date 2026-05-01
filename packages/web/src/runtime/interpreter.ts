import { Parser } from "expr-eval";
import type { FlowEdge, FlowNode, RuntimeState } from "../types/flow";

const parser = new Parser();

type RuntimeOptions = {
  readInput?: (prompt: string, variable: string) => string | number | boolean;
  inputValues?: Record<string, string | number | boolean>;
  startNodeId?: string;
  runtime?: RuntimeState;
};

const evaluateExpression = (expression: string, variables: RuntimeState["variables"]) =>
  parser.evaluate(expression, variables as Parameters<typeof parser.evaluate>[1]);
const getEdgeLabel = (edge: FlowEdge) => edge.data?.label ?? edge.label;

const initialRuntime = (): RuntimeState => ({
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

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const cloneRuntime = (runtime: RuntimeState): RuntimeState => ({
  ...runtime,
  visitedNodeIds: [...runtime.visitedNodeIds],
  invalidNodeIds: [...runtime.invalidNodeIds],
  variables: { ...runtime.variables },
  output: [...runtime.output],
  errors: [...runtime.errors],
  pendingInput: runtime.pendingInput ? { ...runtime.pendingInput } : null,
});

export const runLinearFlow = (nodes: FlowNode[], edges: FlowEdge[], options: RuntimeOptions = {}): RuntimeState => {
  const runtime = options.runtime ?? initialRuntime();
  runtime.executionMode = "run";
  runtime.pendingInput = null;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const startNode = options.startNodeId ? nodeById.get(options.startNodeId) : nodes.find((node) => node.type === "start");

  if (!startNode) {
    return { ...runtime, errors: [...runtime.errors, "Manca il blocco Start."] };
  }

  let current: FlowNode | undefined = startNode;
  const visitedSteps = new Set<string>();
  let stepCount = 0;

  while (current) {
    runtime.currentNodeId = current.id;
    runtime.visitedNodeIds.push(current.id);
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

    if (current.type === "input") {
      const variable = current.data.variable?.trim();

      if (!variable) {
        runtime.errors.push(`Input incompleto nel blocco "${current.data.label}".`);
        runtime.invalidNodeIds.push(current.id);
        break;
      }

      const inputValue = options.inputValues?.[current.id];

      if (inputValue !== undefined) {
        runtime.variables[variable] = inputValue;
      } else if (options.readInput) {
        try {
          runtime.variables[variable] = options.readInput(current.data.prompt ?? "", variable);
        } catch (error) {
          runtime.invalidNodeIds.push(current.id);
          runtime.errors.push(`Errore in ${current.data.label}: ${getErrorMessage(error)}.`);
          break;
        }
      } else {
        runtime.pendingInput = {
          nodeId: current.id,
          variable,
          prompt: current.data.prompt ?? `Inserisci ${variable}`,
        };
        runtime.isRunning = true;
        return runtime;
      }
    }

    if (current.type === "assign") {
      const variable = current.data.variable?.trim();
      const expression = current.data.expression?.trim();

      if (!variable || !expression) {
        runtime.errors.push(`Assignment incompleto nel blocco "${current.data.label}".`);
        break;
      }

      try {
        runtime.variables[variable] = evaluateExpression(expression, runtime.variables);
      } catch (error) {
        runtime.invalidNodeIds.push(current.id);
        runtime.errors.push(`Errore in ${current.data.label}: ${getErrorMessage(error)}.`);
        break;
      }
    }

    if (current.type === "output") {
      const expression = current.data.expression?.trim();

      if (!expression) {
        runtime.errors.push(`Output incompleto nel blocco "${current.data.label}".`);
        break;
      }

      try {
        runtime.output.push(String(evaluateExpression(expression, runtime.variables)));
      } catch (error) {
        runtime.invalidNodeIds.push(current.id);
        runtime.errors.push(`Errore in ${current.data.label}: ${getErrorMessage(error)}.`);
        break;
      }
    }

    let nextEdge: FlowEdge | undefined;

    if (current.type === "if") {
      const expression = current.data.expression?.trim();

      if (!expression) {
        runtime.errors.push(`If incompleto nel blocco "${current.data.label}".`);
        runtime.invalidNodeIds.push(current.id);
        break;
      }

      try {
        const conditionResult = Boolean(evaluateExpression(expression, runtime.variables));
        nextEdge = edges.find((edge) => edge.source === current?.id && getEdgeLabel(edge) === (conditionResult ? "true" : "false"));
      } catch (error) {
        runtime.invalidNodeIds.push(current.id);
        runtime.errors.push(`Errore in ${current.data.label}: ${getErrorMessage(error)}.`);
        break;
      }
    } else {
      nextEdge = edges.find((edge) => edge.source === current?.id);
    }

    if (!nextEdge) {
      runtime.errors.push(`Il blocco "${current.data.label}" non ha un collegamento in uscita.`);
      runtime.invalidNodeIds.push(current.id);
      break;
    }

    current = nodeById.get(nextEdge.target);

    if (!current) {
      runtime.errors.push(`Collegamento verso nodo inesistente: ${nextEdge.target}.`);
      runtime.invalidNodeIds.push(nextEdge.target);
      break;
    }
  }

  runtime.isRunning = false;
  runtime.executionMode = "idle";
  return runtime;
};

export const continueLinearFlow = (
  nodes: FlowNode[],
  edges: FlowEdge[],
  runtime: RuntimeState,
  inputValue: string | number | boolean,
): RuntimeState => {
  if (!runtime.pendingInput) {
    return runtime;
  }

  const pendingInput = runtime.pendingInput;
  const nextEdge = edges.find((edge) => edge.source === pendingInput.nodeId);

  const nextRuntime: RuntimeState = {
    ...runtime,
    pendingInput: null,
    variables: {
      ...runtime.variables,
      [pendingInput.variable]: inputValue,
    },
    isRunning: true,
    executionMode: "run",
  };

  if (!nextEdge) {
    return {
      ...nextRuntime,
      isRunning: false,
      invalidNodeIds: [...nextRuntime.invalidNodeIds, pendingInput.nodeId],
      errors: [...nextRuntime.errors, `Il blocco Input non ha un collegamento in uscita.`],
    };
  }

  return runLinearFlow(nodes, edges, {
    startNodeId: nextEdge.target,
    runtime: nextRuntime,
  });
};

export const stepLinearFlow = (nodes: FlowNode[], edges: FlowEdge[], runtime: RuntimeState = initialRuntime()): RuntimeState => {
  if (runtime.pendingInput) {
    return runtime;
  }

  const nextRuntime = cloneRuntime(runtime);
  nextRuntime.executionMode = "step";
  nextRuntime.pendingInput = null;
  nextRuntime.isRunning = true;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const current = nextRuntime.currentNodeId
    ? nodeById.get(nextRuntime.currentNodeId)
    : nodes.find((node) => node.type === "start");

  if (!current) {
    return {
      ...nextRuntime,
      executionMode: "idle",
      isRunning: false,
      errors: [...nextRuntime.errors, "Manca il blocco Start."],
    };
  }

  nextRuntime.currentNodeId = current.id;

  if (current.type === "end") {
    return {
      ...nextRuntime,
      executionMode: "idle",
      isRunning: false,
      visitedNodeIds: [...nextRuntime.visitedNodeIds, current.id],
    };
  }

  if (current.type === "input") {
    const variable = current.data.variable?.trim();

    if (!variable) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Input incompleto nel blocco "${current.data.label}".`],
      };
    }

    return {
      ...nextRuntime,
      pendingInput: {
        nodeId: current.id,
        variable,
        prompt: current.data.prompt ?? `Inserisci ${variable}`,
      },
    };
  }

  if (current.type === "assign") {
    const variable = current.data.variable?.trim();
    const expression = current.data.expression?.trim();

    if (!variable || !expression) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Assignment incompleto nel blocco "${current.data.label}".`],
      };
    }

    try {
      nextRuntime.variables[variable] = evaluateExpression(expression, nextRuntime.variables);
    } catch (error) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Errore in ${current.data.label}: ${getErrorMessage(error)}.`],
      };
    }
  }

  if (current.type === "output") {
    const expression = current.data.expression?.trim();

    if (!expression) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Output incompleto nel blocco "${current.data.label}".`],
      };
    }

    try {
      nextRuntime.output.push(String(evaluateExpression(expression, nextRuntime.variables)));
    } catch (error) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Errore in ${current.data.label}: ${getErrorMessage(error)}.`],
      };
    }
  }

  let nextEdge: FlowEdge | undefined;

  if (current.type === "if") {
    const expression = current.data.expression?.trim();

    if (!expression) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `If incompleto nel blocco "${current.data.label}".`],
      };
    }

    try {
      const conditionResult = Boolean(evaluateExpression(expression, nextRuntime.variables));
      nextEdge = edges.find((edge) => edge.source === current.id && getEdgeLabel(edge) === (conditionResult ? "true" : "false"));
    } catch (error) {
      return {
        ...nextRuntime,
        executionMode: "idle",
        isRunning: false,
        invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
        errors: [...nextRuntime.errors, `Errore in ${current.data.label}: ${getErrorMessage(error)}.`],
      };
    }
  } else {
    nextEdge = edges.find((edge) => edge.source === current.id);
  }

  if (!nextEdge) {
    return {
      ...nextRuntime,
      executionMode: "idle",
      isRunning: false,
      invalidNodeIds: [...nextRuntime.invalidNodeIds, current.id],
      errors: [...nextRuntime.errors, `Il blocco "${current.data.label}" non ha un collegamento in uscita.`],
    };
  }

  if (!nodeById.has(nextEdge.target)) {
    return {
      ...nextRuntime,
      executionMode: "idle",
      isRunning: false,
      invalidNodeIds: [...nextRuntime.invalidNodeIds, nextEdge.target],
      errors: [...nextRuntime.errors, `Collegamento verso nodo inesistente: ${nextEdge.target}.`],
    };
  }

  return {
    ...nextRuntime,
    currentNodeId: nextEdge.target,
    visitedNodeIds: [...nextRuntime.visitedNodeIds, current.id],
  };
};

export const continueStepFlow = (
  nodes: FlowNode[],
  edges: FlowEdge[],
  runtime: RuntimeState,
  inputValue: string | number | boolean,
): RuntimeState => {
  if (!runtime.pendingInput) {
    return runtime;
  }

  const nextRuntime = cloneRuntime(runtime);
  const pendingInput = nextRuntime.pendingInput;
  const nextEdge = edges.find((edge) => edge.source === pendingInput?.nodeId);

  if (!pendingInput) {
    return runtime;
  }

  nextRuntime.variables[pendingInput.variable] = inputValue;
  nextRuntime.pendingInput = null;
  nextRuntime.visitedNodeIds.push(pendingInput.nodeId);

  if (!nextEdge) {
    return {
      ...nextRuntime,
      executionMode: "idle",
      isRunning: false,
      invalidNodeIds: [...nextRuntime.invalidNodeIds, pendingInput.nodeId],
      errors: [...nextRuntime.errors, `Il blocco Input non ha un collegamento in uscita.`],
    };
  }

  return {
    ...nextRuntime,
    currentNodeId: nextEdge.target,
    executionMode: "step",
    isRunning: true,
  };
};
