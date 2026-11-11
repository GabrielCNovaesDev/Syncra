import { Handle, Position } from "@xyflow/react";
import type { CSSProperties } from "react";
import type { NoBot } from "@syncra/shared";
import { cores, icones, rotulos, textoPreview } from "../store/studio";
import { Icon } from "./Icon";

export type FlowNodeData = {
  no: NoBot;
  inicial: boolean;
  erros: number;
  avisos?: number;
  ativo: boolean;
};

type FlowNodeProps = {
  data: FlowNodeData;
  selected?: boolean;
};

export function FlowNode({ data, selected }: FlowNodeProps) {
  const { no, inicial, erros, avisos = 0, ativo } = data;
  const estilo = { "--node-color": cores[no.tipo] } as CSSProperties;
  const classes = ["flow-node"];
  if (selected) classes.push("selected");
  if (ativo) classes.push("active-run");
  if (erros > 0) classes.push("has-error");
  else if (avisos > 0) classes.push("has-warning");

  return (
    <div className={classes.join(" ")} style={estilo}>
      {inicial ? (
        <span className="flow-node-start">
          <Icon name="play" size={9} filled /> Início
        </span>
      ) : null}
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="flow-node-top">
        <span className="flow-node-icon">
          <Icon name={icones[no.tipo]} size={13} strokeWidth={2} />
        </span>
        <span>{rotulos[no.tipo]}</span>
        {erros > 0 || avisos > 0 ? (
          <span className={erros > 0 ? "flow-node-error" : "flow-node-error flow-node-warning"} title={erros > 0 ? `${erros} pendência(s) neste nó` : `${avisos} alerta(s) neste nó`}>
            <Icon name="alert" size={11} strokeWidth={2.2} />
          </span>
        ) : (
          <span className="flow-node-more">
            <Icon name="grip" size={13} />
          </span>
        )}
      </div>
      <div className="flow-node-body">{textoPreview(no)}</div>
      {no.tipo === "pergunta" ? (
        <div className="flow-node-chip">
          <Icon name="arrowRight" size={10} /> {no.variavel_destino}
        </div>
      ) : null}
      {no.tipo === "ia" ? (
        <div className="flow-node-chip">
          <Icon name="zap" size={10} /> {no.modelo === "modelo-rapido" ? "Rápido" : "Qualidade"}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}
