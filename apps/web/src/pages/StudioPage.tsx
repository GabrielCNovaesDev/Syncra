import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { cores, useStudioStore } from "../store/studio";

export function StudioPage() {
  const definicao = useStudioStore((s) => s.definicao);
  const valida = useStudioStore((s) => s.valida);
  const erros = useStudioStore((s) => s.erros);
  const validarLocal = useStudioStore((s) => s.validarLocal);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = definicao.nos.map((no, i) => {
      const pos = definicao.metadados_editor?.posicoes[no.id] ?? {
        x: 80 + (i % 4) * 220,
        y: 80 + Math.floor(i / 4) * 140,
      };
      return {
        id: no.id,
        position: pos,
        data: { label: `${no.tipo}: ${no.id}` },
        style: {
          border: `2px solid ${cores[no.tipo]}`,
          borderRadius: 8,
          padding: 8,
          background: "white",
        },
      };
    });
    const edges: Edge[] = definicao.conexoes.map((c, i) => ({
      id: `${c.de}-${c.para}-${i}`,
      source: c.de,
      target: c.para,
      label: c.condicao ?? undefined,
    }));
    return { nodes, edges };
  }, [definicao]);

  return (
    <div>
      <p className="muted">
        Editor visual (E3 em construção). O grafo abaixo já usa o formato canônico compartilhado
        com o motor.
      </p>
      <button type="button" onClick={validarLocal}>
        Validar definição (V-01 a V-08)
      </button>
      <div className={`validacao ${valida ? "ok" : "erro"}`}>
        {valida ? "Definição válida." : erros.join(" · ")}
      </div>
      <div className="canvas">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
