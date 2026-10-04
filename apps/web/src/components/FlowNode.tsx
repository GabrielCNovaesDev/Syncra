import { Handle, Position } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { NoBot } from "@syncra/shared";
import { cores, icones, rotulos, textoPreview } from "../store/studio";

type FlowNodeProps = {
  data: { no: NoBot };
  selected?: boolean;
};

export function FlowNode({ data, selected }: FlowNodeProps) {
  const { no } = data;
  const estilo = { "--node-color": cores[no.tipo] } as CSSProperties;

  return (
    <div className={selected ? "flow-node selected" : "flow-node"} style={estilo}>
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="flow-node-top">
        <span className="flow-node-icon">{icones[no.tipo]}</span>
        <span>{rotulos[no.tipo]}</span>
        <span className="flow-node-more">•••</span>
      </div>
      <div className="flow-node-body">{textoPreview(no)}</div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}
