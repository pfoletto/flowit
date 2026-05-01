import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNode, FlowNodeKind } from "../types/flow";

const nodeClassByType: Record<FlowNodeKind, string> = {
  start: "flow-node flow-node--terminal",
  end: "flow-node flow-node--terminal",
  input: "flow-node flow-node--io",
  assign: "flow-node flow-node--process",
  output: "flow-node flow-node--io",
  if: "flow-node flow-node--decision",
};

const FlowNodeView = ({ data, type, selected }: NodeProps<FlowNode>) => {
  const hasInput = type !== "start";
  const hasOutput = type !== "end";
  const isDecision = type === "if";

  return (
    <div className={`${nodeClassByType[type]} ${selected ? "flow-node--selected" : ""} ${data.status ? `flow-node--${data.status}` : ""}`}>
      {hasInput && <Handle type="target" position={Position.Top} />}
      <div className="flow-node-content">
        <strong>{data.label}</strong>
        {data.variable && <span>{data.variable}</span>}
        {data.prompt && <code>{data.prompt}</code>}
        {data.expression && <code>{data.expression}</code>}
      </div>
      {isDecision ? (
        <>
          <Handle id="true" type="source" position={Position.Right} />
          <Handle id="false" type="source" position={Position.Left} />
        </>
      ) : (
        hasOutput && <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
};

export const nodeTypes = {
  start: FlowNodeView,
  end: FlowNodeView,
  input: FlowNodeView,
  assign: FlowNodeView,
  output: FlowNodeView,
  if: FlowNodeView,
};
