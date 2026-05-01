import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { nodeTypes } from "../flow/nodeTypes";
import { useFlowStore } from "../store/flowStore";
import type { FlowEdge, FlowNodeData } from "../types/flow";

const edgeStyleByLabel = {
  true: {
    stroke: "#16a34a",
    strokeWidth: 2.5,
  },
  false: {
    stroke: "#dc2626",
    strokeWidth: 2.5,
  },
} satisfies Record<"true" | "false", FlowEdge["style"]>;

export const FlowCanvas = () => {
  const nodes = useFlowStore((state) => state.project.nodes);
  const edges = useFlowStore((state) => state.project.edges);
  const runtime = useFlowStore((state) => state.runtime);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const selectNode = useFlowStore((state) => state.selectNode);
  const renderedEdges = edges.map((edge) => {
    const label = edge.data?.label;

    if (label !== "true" && label !== "false") {
      return edge;
    }

    return {
      ...edge,
      label,
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 999,
      labelBgStyle: {
        fill: label === "true" ? "#dcfce7" : "#fee2e2",
        stroke: label === "true" ? "#16a34a" : "#dc2626",
        strokeWidth: 1,
      },
      labelStyle: {
        fill: label === "true" ? "#166534" : "#991b1b",
        fontSize: 12,
        fontWeight: 700,
      },
      style: edgeStyleByLabel[label],
    };
  });
  const renderedNodes = nodes.map((node) => {
    const status: FlowNodeData["status"] = runtime.invalidNodeIds.includes(node.id)
      ? "invalid"
      : runtime.currentNodeId === node.id
        ? "current"
        : runtime.visitedNodeIds.includes(node.id)
          ? "visited"
          : undefined;

    return {
      ...node,
      data: {
        ...node.data,
        status,
      },
    };
  });

  return (
    <main className="canvas-shell">
      <ReactFlow
        nodes={renderedNodes}
        edges={renderedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </main>
  );
};
