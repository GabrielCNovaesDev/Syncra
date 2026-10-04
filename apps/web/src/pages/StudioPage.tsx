import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ChangeEvent, CSSProperties } from "react";
import { useMemo, useRef } from "react";
import type { ModeloLogico, NoBot, TipoVariavel, VariavelBot } from "@syncra/shared";
import { FlowNode } from "../components/FlowNode";
import {
  ORDEM_PALETA,
  cores,
  icones,
  rotulos,
  useStudioStore,
  type Selecao,
} from "../store/studio";

const nodeTypes: NodeTypes = { syncra: FlowNode as unknown as NodeTypes[string] };

type AtualizarNo = (id: string, atualizar: (no: NoBot) => NoBot) => void;

export function StudioPage() {
  const definicao = useStudioStore((s) => s.definicao);
  const valida = useStudioStore((s) => s.valida);
  const erros = useStudioStore((s) => s.erros);
  const selecao = useStudioStore((s) => s.selecao);
  const aba = useStudioStore((s) => s.aba);
  const erroImportacao = useStudioStore((s) => s.erroImportacao);

  const selecionarNo = useStudioStore((s) => s.selecionarNo);
  const selecionarConexao = useStudioStore((s) => s.selecionarConexao);
  const limparSelecao = useStudioStore((s) => s.limparSelecao);
  const setAba = useStudioStore((s) => s.setAba);
  const dispensarErroImportacao = useStudioStore((s) => s.dispensarErroImportacao);
  const adicionarNo = useStudioStore((s) => s.adicionarNo);
  const moverNo = useStudioStore((s) => s.moverNo);
  const conectar = useStudioStore((s) => s.conectar);
  const exportarJSON = useStudioStore((s) => s.exportarJSON);
  const importarJSON = useStudioStore((s) => s.importarJSON);

  const inputArquivoRef = useRef<HTMLInputElement>(null);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = definicao.nos.map((no, i) => ({
      id: no.id,
      type: "syncra",
      position:
        definicao.metadados_editor?.posicoes[no.id] ?? {
          x: 80 + (i % 3) * 240,
          y: 80 + Math.floor(i / 3) * 180,
        },
      data: { no },
      selected: selecao?.tipo === "no" && selecao.id === no.id,
    }));
    const edges: Edge[] = definicao.conexoes.map((c, i) => ({
      id: `edge-${i}`,
      source: c.de,
      target: c.para,
      label: c.condicao ?? undefined,
      selected: selecao?.tipo === "conexao" && selecao.index === i,
    }));
    return { nodes, edges };
  }, [definicao, selecao]);

  function aoImportarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      if (typeof leitor.result === "string") importarJSON(leitor.result);
    };
    leitor.readAsText(arquivo);
    evento.target.value = "";
  }

  function aoExportar() {
    const blob = new Blob([exportarJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${definicao.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="studio-page">
      <div className="studio-heading">
        <div>
          <div className="eyebrow">
            ESTÚDIO VISUAL <span className="eyebrow-slash">/</span> RASCUNHO LOCAL
          </div>
          <h1>
            Construa seu fluxo<span className="heading-dot">.</span>
          </h1>
          <p>Adicione etapas, conecte caminhos e ajuste cada resposta.</p>
        </div>
        <div className="studio-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={() => inputArquivoRef.current?.click()}
          >
            ↥ Importar
          </button>
          <input
            ref={inputArquivoRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={aoImportarArquivo}
          />
          <button type="button" className="button button-primary" onClick={aoExportar}>
            ↧ Exportar JSON
          </button>
        </div>
      </div>

      {erroImportacao ? (
        <div className="import-error">
          <span>{erroImportacao}</span>
          <button type="button" onClick={dispensarErroImportacao}>
            ✕
          </button>
        </div>
      ) : null}

      <div className="editor-banner">
        <span className="banner-dot" />
        <span>
          Seu trabalho é salvo automaticamente <strong>neste navegador</strong>. Publicação e
          conversas chegam com a integração da API.
        </span>
      </div>

      <div className="studio-layout">
        <section className="editor-main">
          <div className="editor-toolbar">
            <div className="toolbar-title">
              <span className="toolbar-icon">◇</span>
              <div>
                <strong>Mapa da conversa</strong>
                <small>
                  {definicao.nos.length} etapas · {definicao.conexoes.length} conexões
                </small>
              </div>
            </div>
            <div className="toolbar-help">Arraste os pontos laterais para conectar</div>
          </div>

          <div className="node-palette" aria-label="Adicionar etapa">
            <span>ADICIONAR ETAPA</span>
            {ORDEM_PALETA.map((tipo) => (
              <button
                key={tipo}
                type="button"
                style={{ "--node-color": cores[tipo] } as CSSProperties}
                onClick={() => adicionarNo(tipo)}
              >
                <span>{icones[tipo]}</span>
                {rotulos[tipo]}
              </button>
            ))}
          </div>

          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onConnect={(conexao) => {
                if (conexao.source && conexao.target) conectar(conexao.source, conexao.target);
              }}
              onNodeClick={(_, node) => selecionarNo(node.id)}
              onEdgeClick={(_, edge) => {
                const index = Number(edge.id.replace("edge-", ""));
                if (!Number.isNaN(index)) selecionarConexao(index);
              }}
              onNodeDragStop={(_, node) => moverNo(node.id, node.position)}
              onPaneClick={limparSelecao}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>

          <div className="editor-foot">
            <span>
              <i /> {valida ? "Fluxo válido" : "Fluxo com pendências"}
            </span>
            <span>Versão do schema: {definicao.versao_schema}</span>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-tabs">
            <button
              type="button"
              className={aba === "propriedades" ? "active" : ""}
              onClick={() => setAba("propriedades")}
            >
              Propriedades
            </button>
            <button
              type="button"
              className={aba === "fluxo" ? "active" : ""}
              onClick={() => setAba("fluxo")}
            >
              Fluxo
            </button>
          </div>
          <div className="inspector-content">
            {aba === "propriedades" ? <PainelPropriedades /> : <PainelFluxo />}
          </div>
          <div className="validation-panel">
            <div className="validation-title">
              <span className={`validation-icon ${valida ? "valid" : "invalid"}`}>
                {valida ? "✓" : "✕"}
              </span>
              <strong>{valida ? "Definição válida" : "Definição inválida"}</strong>
            </div>
            {valida ? (
              <p>O fluxo atende às regras V-01 a V-08.</p>
            ) : (
              <ul>
                {erros.map((erro, i) => (
                  <li key={i}>
                    {erro.regra}: {erro.mensagem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PainelPropriedades() {
  const selecao = useStudioStore((s) => s.selecao);
  const atualizarNo = useStudioStore((s) => s.atualizarNo);
  const excluirNo = useStudioStore((s) => s.excluirNo);
  const definirNoInicial = useStudioStore((s) => s.definirNoInicial);
  const atualizarCondicaoConexao = useStudioStore((s) => s.atualizarCondicaoConexao);
  const excluirConexao = useStudioStore((s) => s.excluirConexao);

  if (!selecao) {
    return (
      <div className="empty-inspector">
        <span>◇</span>
        <h3>Selecione uma etapa</h3>
        <p>Clique em um nó ou conexão no mapa para ajustar suas propriedades.</p>
      </div>
    );
  }

  if (selecao.tipo === "conexao") {
    return (
      <PainelConexao
        index={selecao.index}
        atualizarCondicao={atualizarCondicaoConexao}
        excluir={excluirConexao}
      />
    );
  }

  return (
    <PainelNo
      selecao={selecao}
      atualizarNo={atualizarNo}
      excluirNo={excluirNo}
      definirNoInicial={definirNoInicial}
    />
  );
}

function PainelConexao({
  index,
  atualizarCondicao,
  excluir,
}: {
  index: number;
  atualizarCondicao: (index: number, condicao: string | null) => void;
  excluir: (index: number) => void;
}) {
  const definicao = useStudioStore((s) => s.definicao);
  const conexao = definicao.conexoes[index];
  if (!conexao) return null;
  const noDe = definicao.nos.find((n) => n.id === conexao.de);
  const noPara = definicao.nos.find((n) => n.id === conexao.para);

  return (
    <>
      <div className="inspector-kicker">CONEXÃO SELECIONADA</div>
      <div className="selected-title">
        <span style={{ "--node-color": "#b39bff" } as CSSProperties}>↗</span>
        <div>
          <strong>
            {noDe ? rotulos[noDe.tipo] : conexao.de} → {noPara ? rotulos[noPara.tipo] : conexao.para}
          </strong>
          <small>
            {conexao.de} → {conexao.para}
          </small>
        </div>
      </div>
      <div className="field-stack">
        <label>
          Condição
          <input
            value={conexao.condicao ?? ""}
            placeholder="truthy, else ou vazio"
            onChange={(e) => atualizarCondicao(index, e.target.value.length > 0 ? e.target.value : null)}
          />
          <small>Usado quando a etapa de origem é uma condição com mais de uma saída.</small>
        </label>
      </div>
      <div className="inspector-divider" />
      <button type="button" className="text-button danger" onClick={() => excluir(index)}>
        Excluir conexão
      </button>
    </>
  );
}

function PainelNo({
  selecao,
  atualizarNo,
  excluirNo,
  definirNoInicial,
}: {
  selecao: Extract<Selecao, { tipo: "no" }>;
  atualizarNo: AtualizarNo;
  excluirNo: (id: string) => void;
  definirNoInicial: (id: string) => void;
}) {
  const definicao = useStudioStore((s) => s.definicao);
  const no = definicao.nos.find((n) => n.id === selecao.id);
  if (!no) return null;

  return (
    <>
      <div className="inspector-kicker">ETAPA SELECIONADA</div>
      <div className="selected-title">
        <span style={{ "--node-color": cores[no.tipo] } as CSSProperties}>{icones[no.tipo]}</span>
        <div>
          <strong>{rotulos[no.tipo]}</strong>
          <small>{no.id}</small>
        </div>
      </div>
      <div className="field-stack">
        <CamposNo no={no} atualizarNo={atualizarNo} />
      </div>
      <div className="inspector-divider" />
      <label className="radio-field">
        <input
          type="radio"
          checked={definicao.no_inicial === no.id}
          onChange={() => definirNoInicial(no.id)}
        />
        Definir como etapa inicial
      </label>
      <button type="button" className="text-button danger" onClick={() => excluirNo(no.id)}>
        Excluir etapa
      </button>
    </>
  );
}

function CamposNo({ no, atualizarNo }: { no: NoBot; atualizarNo: AtualizarNo }) {
  switch (no.tipo) {
    case "mensagem":
      return (
        <label>
          Texto da mensagem
          <textarea
            rows={5}
            value={no.texto}
            onChange={(e) =>
              atualizarNo(no.id, (atual) =>
                atual.tipo === "mensagem" ? { ...atual, texto: e.target.value } : atual,
              )
            }
          />
        </label>
      );
    case "pergunta":
      return (
        <>
          <label>
            Pergunta
            <textarea
              rows={4}
              value={no.texto}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "pergunta" ? { ...atual, texto: e.target.value } : atual,
                )
              }
            />
          </label>
          <label>
            Guardar resposta em
            <input
              value={no.variavel_destino}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "pergunta"
                    ? { ...atual, variavel_destino: e.target.value }
                    : atual,
                )
              }
            />
            <small>Declare esta chave na aba Fluxo.</small>
          </label>
        </>
      );
    case "condicao":
      return (
        <>
          <label>
            Expressão
            <textarea
              rows={3}
              value={no.expressao}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "condicao" ? { ...atual, expressao: e.target.value } : atual,
                )
              }
            />
          </label>
          <p className="field-help">
            Use uma variável declarada. Este nó precisa de pelo menos duas saídas; selecione cada
            conexão para informar sua condição.
          </p>
        </>
      );
    case "ia":
      return (
        <>
          <label>
            Instrução para a IA
            <textarea
              rows={6}
              value={no.instrucao}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "ia" ? { ...atual, instrucao: e.target.value } : atual,
                )
              }
            />
          </label>
          <label>
            Modelo
            <select
              value={no.modelo}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "ia"
                    ? { ...atual, modelo: e.target.value as ModeloLogico }
                    : atual,
                )
              }
            >
              <option value="modelo-rapido">Modelo rápido</option>
              <option value="modelo-qualidade">Modelo qualidade</option>
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={no.usar_historico}
              onChange={(e) =>
                atualizarNo(no.id, (atual) =>
                  atual.tipo === "ia" ? { ...atual, usar_historico: e.target.checked } : atual,
                )
              }
            />
            Usar histórico da conversa
          </label>
        </>
      );
    case "encerramento":
      return (
        <label>
          Mensagem final
          <textarea
            rows={5}
            value={no.texto_final}
            onChange={(e) =>
              atualizarNo(no.id, (atual) =>
                atual.tipo === "encerramento" ? { ...atual, texto_final: e.target.value } : atual,
              )
            }
          />
        </label>
      );
  }
}

function PainelFluxo() {
  const definicao = useStudioStore((s) => s.definicao);
  const atualizarMeta = useStudioStore((s) => s.atualizarMeta);
  const adicionarVariavel = useStudioStore((s) => s.adicionarVariavel);
  const atualizarVariavel = useStudioStore((s) => s.atualizarVariavel);
  const excluirVariavel = useStudioStore((s) => s.excluirVariavel);
  const restaurarExemplo = useStudioStore((s) => s.restaurarExemplo);

  return (
    <>
      <div className="inspector-kicker">CONFIGURAÇÃO GERAL</div>
      <h3>Sobre este fluxo</h3>
      <div className="field-stack">
        <label>
          Nome do bot
          <input value={definicao.nome} onChange={(e) => atualizarMeta({ nome: e.target.value })} />
        </label>
        <label>
          Modelo padrão
          <select
            value={definicao.modelo_padrao}
            onChange={(e) => atualizarMeta({ modelo_padrao: e.target.value as ModeloLogico })}
          >
            <option value="modelo-rapido">Modelo rápido</option>
            <option value="modelo-qualidade">Modelo qualidade</option>
          </select>
        </label>
        <label>
          Instrução global
          <textarea
            rows={4}
            value={definicao.instrucao_global}
            onChange={(e) => atualizarMeta({ instrucao_global: e.target.value })}
          />
        </label>
      </div>

      <div className="inspector-divider" />
      <div className="subheading">
        <strong>Variáveis</strong>
        <button type="button" onClick={adicionarVariavel}>
          ＋ Adicionar
        </button>
      </div>
      {definicao.variaveis.map((variavel: VariavelBot, i: number) => (
        <div className="variable-card" key={i}>
          <div className="variable-head">
            <span>VARIÁVEL {i + 1}</span>
            <button
              type="button"
              aria-label={`Excluir variável ${variavel.chave}`}
              onClick={() => excluirVariavel(i)}
            >
              ×
            </button>
          </div>
          <input
            aria-label="Chave da variável"
            value={variavel.chave}
            onChange={(e) => atualizarVariavel(i, { chave: e.target.value })}
          />
          <div className="variable-options">
            <select
              aria-label="Tipo da variável"
              value={variavel.tipo}
              onChange={(e) => atualizarVariavel(i, { tipo: e.target.value as TipoVariavel })}
            >
              <option value="texto">Texto</option>
              <option value="numero">Número</option>
              <option value="booleano">Booleano</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={variavel.obrigatoria}
                onChange={(e) => atualizarVariavel(i, { obrigatoria: e.target.checked })}
              />
              Obrigatória
            </label>
          </div>
        </div>
      ))}

      <div className="inspector-divider" />
      <button type="button" className="text-button" onClick={restaurarExemplo}>
        Restaurar exemplo
      </button>
    </>
  );
}
