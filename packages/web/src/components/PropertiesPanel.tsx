import { useMemo } from "react";
import { useFlowStore } from "../store/flowStore";

export const PropertiesPanel = () => {
  const nodes = useFlowStore((state) => state.project.nodes);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const updateSelectedNode = useFlowStore((state) => state.updateSelectedNode);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId]);

  if (!selectedNode) {
    return (
      <aside className="properties-panel">
        <h2>Proprieta'</h2>
        <p className="empty-state">Seleziona un blocco dal canvas.</p>
      </aside>
    );
  }

  return (
    <aside className="properties-panel">
      <h2>Proprieta'</h2>

      <label>
        <span>Label</span>
        <input
          value={selectedNode.data.label}
          onChange={(event) => updateSelectedNode({ label: event.target.value })}
        />
      </label>

      {(selectedNode.type === "assign" || selectedNode.type === "input") && (
        <label>
          <span>Variabile</span>
          <input
            value={selectedNode.data.variable ?? ""}
            onChange={(event) => updateSelectedNode({ variable: event.target.value })}
          />
        </label>
      )}

      {selectedNode.type === "input" && (
        <label>
          <span>Prompt</span>
          <input
            value={selectedNode.data.prompt ?? ""}
            onChange={(event) => updateSelectedNode({ prompt: event.target.value })}
          />
        </label>
      )}

      {(selectedNode.type === "assign" || selectedNode.type === "output" || selectedNode.type === "if") && (
        <label>
          <span>{selectedNode.type === "if" ? "Condizione" : "Espressione"}</span>
          <input
            value={selectedNode.data.expression ?? ""}
            onChange={(event) => updateSelectedNode({ expression: event.target.value })}
          />
        </label>
      )}
    </aside>
  );
};
