import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { nodeTypes } from "../flow/nodeTypes";
import { useFlowStore } from "../store/flowStore";
import type { FlowNodeData } from "../types/flow";

export const FlowCanvas = () => {
  const nodes = useFlowStore((state) => state.project.nodes);
  const edges = useFlowStore((state) => state.project.edges);
  const runtime = useFlowStore((state) => state.runtime);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const selectNode = useFlowStore((state) => state.selectNode);
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
        edges={edges}
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
