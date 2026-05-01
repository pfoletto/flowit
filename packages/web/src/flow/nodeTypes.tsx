import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNode, FlowNodeKind } from "../types/flow";

const nodeClassByType: Record<FlowNodeKind, string> = {
  start: "flow-node flow-node--terminal",
  end: "flow-node flow-node--terminal",
  assign: "flow-node flow-node--process",
  output: "flow-node flow-node--output",
};

const FlowNodeView = ({ data, type, selected }: NodeProps<FlowNode>) => {
  const hasInput = type !== "start";
  const hasOutput = type !== "end";

  return (
    <div className={`${nodeClassByType[type]} ${selected ? "flow-node--selected" : ""} ${data.status ? `flow-node--${data.status}` : ""}`}>
      {hasInput && <Handle type="target" position={Position.Top} />}
      <strong>{data.label}</strong>
      {data.variable && <span>{data.variable}</span>}
      {data.expression && <code>{data.expression}</code>}
      {hasOutput && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
};

export const nodeTypes = {
  start: FlowNodeView,
  end: FlowNodeView,
  assign: FlowNodeView,
  output: FlowNodeView,
};
