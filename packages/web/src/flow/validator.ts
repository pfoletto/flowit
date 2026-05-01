import type { FlowEdge, FlowNode, ValidationIssue } from "../types/flow";

const nodeLabel = (node: FlowNode) => `"${node.data.label || node.id}"`;

const getOutgoingEdges = (node: FlowNode, edges: FlowEdge[]) => edges.filter((edge) => edge.source === node.id);
const getIncomingEdges = (node: FlowNode, edges: FlowEdge[]) => edges.filter((edge) => edge.target === node.id);
const getEdgeLabel = (edge: FlowEdge) => edge.data?.label ?? edge.label;

export const validateFlow = (nodes: FlowNode[], edges: FlowEdge[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const startNodes = nodes.filter((node) => node.type === "start");
  const endNodes = nodes.filter((node) => node.type === "end");

  if (startNodes.length === 0) {
    issues.push({ message: "Manca il blocco Start." });
  }

  if (startNodes.length > 1) {
    startNodes.forEach((node) => {
      issues.push({ nodeId: node.id, message: `Il diagramma deve avere un solo Start: trovato ${nodeLabel(node)}.` });
    });
  }

  if (endNodes.length === 0) {
    issues.push({ message: "Manca almeno un blocco End." });
  }

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      issues.push({ message: `Collegamento con origine inesistente: ${edge.source}.` });
    }

    if (!nodeIds.has(edge.target)) {
      issues.push({ message: `Collegamento verso nodo inesistente: ${edge.target}.` });
    }
  });

  nodes.forEach((node) => {
    const outgoingEdges = getOutgoingEdges(node, edges);
    const incomingEdges = getIncomingEdges(node, edges);

    if (node.type === "start" && incomingEdges.length > 0) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} non deve avere collegamenti in ingresso.` });
    }

    if (node.type !== "start" && incomingEdges.length === 0) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} non e' raggiunto da nessun collegamento.` });
    }

    if (node.type === "end" && outgoingEdges.length > 0) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} non deve avere collegamenti in uscita.` });
    }

    if (node.type !== "end" && outgoingEdges.length === 0) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} deve avere un collegamento in uscita.` });
    }

    if (node.type !== "end" && node.type !== "if" && outgoingEdges.length > 1) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} ha piu' di un collegamento in uscita nel runtime MVP.` });
    }

    if (node.type === "assign") {
      if (!node.data.variable?.trim()) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede una variabile.` });
      }

      if (!node.data.expression?.trim()) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede un'espressione.` });
      }
    }

    if (node.type === "input" && !node.data.variable?.trim()) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede una variabile di input.` });
    }

    if (node.type === "output" && !node.data.expression?.trim()) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede un'espressione di output.` });
    }

    if (node.type === "if") {
      const hasTrueEdge = outgoingEdges.some((edge) => getEdgeLabel(edge) === "true");
      const hasFalseEdge = outgoingEdges.some((edge) => getEdgeLabel(edge) === "false");

      if (!node.data.expression?.trim()) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede una condizione.` });
      }

      if (outgoingEdges.length !== 2) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} deve avere esattamente due uscite: true e false.` });
      }

      if (!hasTrueEdge) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede un'uscita true.` });
      }

      if (!hasFalseEdge) {
        issues.push({ nodeId: node.id, message: `${nodeLabel(node)} richiede un'uscita false.` });
      }
    }
  });

  const startNode = startNodes[0];
  if (!startNode) {
    return issues;
  }

  const reachable = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const walk = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      issues.push({ nodeId, message: "Il diagramma contiene un ciclo, non supportato nel runtime lineare MVP." });
      return;
    }

    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    reachable.add(nodeId);

    edges
      .filter((edge) => edge.source === nodeId)
      .forEach((edge) => {
        if (nodeIds.has(edge.target)) {
          walk(edge.target);
        }
      });

    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  walk(startNode.id);

  nodes.forEach((node) => {
    if (!reachable.has(node.id)) {
      issues.push({ nodeId: node.id, message: `${nodeLabel(node)} non e' raggiungibile dallo Start.` });
    }
  });

  return issues;
};

export const getInvalidNodeIds = (issues: ValidationIssue[]) =>
  Array.from(new Set(issues.flatMap((issue) => (issue.nodeId ? [issue.nodeId] : []))));
