import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { nodeTypes } from "../flow/nodeTypes";
import { useFlowStore } from "../store/flowStore";

export const FlowCanvas = () => {
  const nodes = useFlowStore((state) => state.project.nodes);
  const edges = useFlowStore((state) => state.project.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const selectNode = useFlowStore((state) => state.selectNode);

  return (
    <main className="canvas-shell">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </main>
  );
};
