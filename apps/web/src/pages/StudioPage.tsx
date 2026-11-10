import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ChangeEvent, CSSProperties, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ModeloLogico, NoBot, TipoNo, TipoVariavel, VariavelBot } from "@syncra/shared";
import { FlowNode, type FlowNodeData } from "../components/FlowNode";
import { Icon } from "../components/Icon";
import { SimuladorChat } from "../components/SimuladorChat";
import {
  ORDEM_PALETA,
  cores,
  descricoes,
  icones,
  rotulos,
  useStudioStore,
  type Selecao,
} from "../store/studio";
import { toast } from "../store/toast";
import { useBotsStore } from "../store/bots";

const nodeTypes: NodeTypes = { syncra: FlowNode as unknown as NodeTypes[string] };

const TIPO_ARRASTE = "application/syncra-no";

type AtualizarNo = (id: string, atualizar: (no: NoBot) => NoBot) => void;

export function StudioPage() {
  return (
    <ReactFlowProvider>
      <Estudio />
    </ReactFlowProvider>
  );
}

function Estudio() {
  const [parametros, setParametros] = useSearchParams();
  const botIdNaUrl = parametros.get("bot");
  const novoNaUrl = parametros.get("novo");
  const ativoId = useBotsStore((s) => s.ativoId);
  const versao = useBotsStore((s) => s.versao);
  const ultimaSalva = useBotsStore((s) => s.ultimaSalva);
  const salvando = useBotsStore((s) => s.carregando);
  const abrirBot = useBotsStore((s) => s.abrir);
  const novoBot = useBotsStore((s) => s.novo);
  const salvarBot = useBotsStore((s) => s.salvar);
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
  const excluirNo = useStudioStore((s) => s.excluirNo);
  const excluirConexao = useStudioStore((s) => s.excluirConexao);
  const conectar = useStudioStore((s) => s.conectar);
  const exportarJSON = useStudioStore((s) => s.exportarJSON);
  const importarJSON = useStudioStore((s) => s.importarJSON);
  const organizarLayout = useStudioStore((s) => s.organizarLayout);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [simulando, setSimulando] = useState(false);
  const [noAtivo, setNoAtivo] = useState<string | null>(null);
  const [arrastandoSobre, setArrastandoSobre] = useState(false);
  const alterado = !ativoId || JSON.stringify(definicao) !== ultimaSalva;

  useEffect(() => {
    if (novoNaUrl === "1") { novoBot(); setParametros({}, { replace: true }); return; }
    if (botIdNaUrl && botIdNaUrl !== ativoId) {
      void abrirBot(botIdNaUrl).catch((erro) =>
        toast.erro("Não foi possível abrir o bot", String(erro instanceof Error ? erro.message : erro)));
    }
  }, [botIdNaUrl, novoNaUrl, ativoId, abrirBot, novoBot, setParametros]);

  async function aoSalvar() {
    try {
      const numero = await salvarBot();
      const id = useBotsStore.getState().ativoId;
      if (id) setParametros({ bot: id }, { replace: true });
      toast.sucesso("Bot salvo", `Versão ${numero} guardada na sua conta.`);
    } catch (erro) {
      toast.erro("Não foi possível salvar", erro instanceof Error ? erro.message : undefined);
    }
  }

  const errosPorNo = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const erro of erros) {
      if (erro.no_id) mapa.set(erro.no_id, (mapa.get(erro.no_id) ?? 0) + 1);
    }
    return mapa;
  }, [erros]);

  const nodesDoStore = useMemo<Node[]>(
    () =>
      definicao.nos.map((no, i) => ({
        id: no.id,
        type: "syncra",
        position: definicao.metadados_editor?.posicoes[no.id] ?? {
          x: 80 + (i % 3) * 260,
          y: 80 + Math.floor(i / 3) * 190,
        },
        data: {
          no,
          inicial: definicao.no_inicial === no.id,
          erros: errosPorNo.get(no.id) ?? 0,
          ativo: noAtivo === no.id,
        } satisfies FlowNodeData,
        selected: selecao?.tipo === "no" && selecao.id === no.id,
      })),
    [definicao, selecao, errosPorNo, noAtivo],
  );

  // O store é a fonte de verdade; o estado local só existe para o arraste fluir
  // quadro a quadro. A posição definitiva é gravada em onNodeDragStop.
  const [nodes, setNodes] = useState<Node[]>(nodesDoStore);
  useEffect(() => setNodes(nodesDoStore), [nodesDoStore]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((atual) =>
        applyNodeChanges(
          changes.filter((c) => c.type === "position" || c.type === "dimensions"),
          atual,
        ),
      ),
    [],
  );

  const edges = useMemo<Edge[]>(
    () =>
      definicao.conexoes.map((c, i) => {
        const origem = definicao.nos.find((n) => n.id === c.de);
        const cor = origem ? cores[origem.tipo] : "#8a8da3";
        const selecionada = selecao?.tipo === "conexao" && selecao.index === i;
        const emExecucao = noAtivo !== null && c.de === noAtivo;
        return {
          id: `edge-${i}`,
          source: c.de,
          target: c.para,
          type: "smoothstep",
          label: c.condicao ?? undefined,
          animated: emExecucao || selecionada,
          selected: selecionada,
          style: {
            stroke: cor,
            strokeWidth: selecionada ? 2.6 : 1.8,
            opacity: selecionada ? 1 : 0.75,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: cor, width: 16, height: 16 },
          labelBgPadding: [6, 3] as [number, number],
          labelBgBorderRadius: 5,
        };
      }),
    [definicao, selecao, noAtivo],
  );

  function aoImportarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      if (typeof leitor.result !== "string") return;
      importarJSON(leitor.result);
      if (!useStudioStore.getState().erroImportacao) {
        toast.sucesso("Fluxo importado", arquivo.name);
        window.setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 50);
      }
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
    toast.sucesso("JSON exportado", "A definição foi baixada para o seu computador.");
  }

  function aoArrastarItem(evento: DragEvent<HTMLButtonElement>, tipo: TipoNo) {
    evento.dataTransfer.setData(TIPO_ARRASTE, tipo);
    evento.dataTransfer.effectAllowed = "move";
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastandoSobre(false);
    const tipo = evento.dataTransfer.getData(TIPO_ARRASTE) as TipoNo;
    if (!tipo || !ORDEM_PALETA.includes(tipo)) return;
    const posicao = screenToFlowPosition({ x: evento.clientX, y: evento.clientY });
    // Centraliza o nó no ponteiro (largura ~220, altura ~90).
    adicionarNo(tipo, { x: Math.round(posicao.x - 110), y: Math.round(posicao.y - 40) });
  }

  return (
    <div className="studio-page page-enter">
      <div className="studio-heading">
        <div>
          <div className="eyebrow">
            ESTÚDIO VISUAL <span className="eyebrow-slash">/</span> {ativoId ? `VERSÃO ${versao}` : "NOVO BOT"}
          </div>
          <h1>
            Construa seu fluxo<span className="heading-dot">.</span>
          </h1>
          <p>Arraste etapas para o mapa, conecte caminhos e teste a conversa em tempo real.</p>
        </div>
        <div className="studio-actions">
          <button type="button" className="button button-ghost" onClick={() => { novoBot(); setParametros({}, { replace: true }); }}>
            <Icon name="plus" size={15} /> Novo
          </button>
          <button type="button" className="button button-primary" disabled={!valida || salvando || !alterado} onClick={() => { void aoSalvar(); }}>
            <Icon name="check" size={15} /> {salvando ? "Salvando…" : "Salvar bot"}
          </button>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => inputArquivoRef.current?.click()}
          >
            <Icon name="upload" size={15} /> Importar
          </button>
          <input
            ref={inputArquivoRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={aoImportarArquivo}
          />
          <button type="button" className="button button-ghost" onClick={aoExportar}>
            <Icon name="download" size={15} /> Exportar
          </button>
          <button
            type="button"
            className={simulando ? "button button-primary is-on" : "button button-primary"}
            onClick={() => {
              setSimulando((v) => !v);
              window.setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 340);
            }}
          >
            <Icon name={simulando ? "x" : "play"} size={14} filled={!simulando} />
            {simulando ? "Fechar teste" : "Testar conversa"}
          </button>
        </div>
      </div>

      {erroImportacao ? (
        <div className="import-error">
          <span>
            <Icon name="alert" size={14} /> {erroImportacao}
          </span>
          <button type="button" aria-label="Dispensar erro" onClick={dispensarErroImportacao}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ) : null}

      <div className="studio-layout">
        <section className="editor-main">
          <div className="editor-toolbar">
            <div className="toolbar-title">
              <span className="toolbar-icon">
                <Icon name="workflow" size={17} />
              </span>
              <div>
                <strong>{definicao.nome}</strong>
                <small>
                  {definicao.nos.length} etapas · {definicao.conexoes.length} conexões · {ativoId ? (alterado ? "alterações não salvas" : `versão ${versao} salva`) : "não salvo"}
                </small>
              </div>
            </div>
            <div className="toolbar-right">
              <div className="toolbar-help">
                <kbd>Arraste</kbd> etapas para o mapa · <kbd>Del</kbd> exclui a seleção
              </div>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => {
                  organizarLayout();
                  window.setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 50);
                }}
              >
                <Icon name="wand" size={14} /> Organizar
              </button>
            </div>
          </div>

          <div className="node-palette" aria-label="Adicionar etapa">
            {ORDEM_PALETA.map((tipo) => (
              <button
                key={tipo}
                type="button"
                draggable
                title={`${descricoes[tipo]} — arraste ou clique`}
                style={{ "--node-color": cores[tipo] } as CSSProperties}
                onDragStart={(e) => aoArrastarItem(e, tipo)}
                onClick={() => adicionarNo(tipo)}
              >
                <span className="palette-icon">
                  <Icon name={icones[tipo]} size={14} strokeWidth={2} />
                </span>
                <span className="palette-text">
                  <strong>{rotulos[tipo]}</strong>
                  <small>{descricoes[tipo]}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="canvas-wrap">
            <div
              className={arrastandoSobre ? "canvas drop-active" : "canvas"}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (!arrastandoSobre) setArrastandoSobre(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) {
                  setArrastandoSobre(false);
                }
              }}
              onDrop={aoSoltar}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onConnect={(conexao) => {
                  if (conexao.source && conexao.target) conectar(conexao.source, conexao.target);
                }}
                onNodeClick={(_, node) => selecionarNo(node.id)}
                onNodeDragStart={(_, node) => selecionarNo(node.id)}
                onEdgeClick={(_, edge) => {
                  const index = Number(edge.id.replace("edge-", ""));
                  if (!Number.isNaN(index)) selecionarConexao(index);
                }}
                onNodeDragStop={(_, node) => moverNo(node.id, node.position)}
                onNodesDelete={(removidos) => removidos.forEach((n) => excluirNo(n.id))}
                onEdgesDelete={(removidas) =>
                  removidas
                    .map((e) => Number(e.id.replace("edge-", "")))
                    .filter((i) => !Number.isNaN(i))
                    .sort((a, b) => b - a)
                    .forEach((i) => excluirConexao(i))
                }
                onPaneClick={limparSelecao}
                deleteKeyCode={["Delete", "Backspace"]}
                snapToGrid
                snapGrid={[20, 20]}
                connectionLineStyle={{ stroke: "#b49cff", strokeWidth: 2, strokeDasharray: "6 4" }}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="#33364a" />
                <Controls showInteractive={false} />
                <MiniMap
                  className="flow-minimap"
                  pannable
                  zoomable
                  nodeColor={(n) => cores[(n.data as FlowNodeData).no.tipo]}
                  maskColor="#10111bcc"
                />
              </ReactFlow>
              {definicao.nos.length === 0 ? (
                <div className="canvas-empty">
                  <Icon name="layers" size={28} />
                  <strong>Comece arrastando uma etapa</strong>
                  <p>Solte uma Mensagem aqui para iniciar a conversa.</p>
                </div>
              ) : null}
              {arrastandoSobre ? (
                <div className="drop-hint">
                  <Icon name="plus" size={14} /> Solte para adicionar a etapa
                </div>
              ) : null}
            </div>
            {simulando ? (
              <SimuladorChat
                definicao={definicao}
                valida={valida}
                aoMudarNoAtivo={setNoAtivo}
                aoFechar={() => {
                  setSimulando(false);
                  window.setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 60);
                }}
              />
            ) : null}
          </div>

          <div className="editor-foot">
            <span className={valida ? "foot-ok" : "foot-warn"}>
              <i /> {valida ? "Fluxo válido" : `${erros.length} pendência(s) no fluxo`}
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
                <Icon name={valida ? "check" : "x"} size={11} strokeWidth={2.6} />
              </span>
              <strong>{valida ? "Definição válida" : "Definição inválida"}</strong>
            </div>
            {valida ? (
              <p>O fluxo atende às regras V-01 a V-08.</p>
            ) : (
              <ul>
                {erros.map((erro, i) => (
                  <li key={i}>
                    {erro.no_id ? (
                      <button type="button" onClick={() => selecionarNo(erro.no_id!)}>
                        {erro.regra}: {erro.mensagem}
                      </button>
                    ) : (
                      <>
                        {erro.regra}: {erro.mensagem}
                      </>
                    )}
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
        <span>
          <Icon name="workflow" size={24} />
        </span>
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
        <span style={{ "--node-color": "#b39bff" } as CSSProperties}>
          <Icon name="arrowUpRight" size={17} />
        </span>
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
        <Icon name="trash" size={12} /> Excluir conexão
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
        <span style={{ "--node-color": cores[no.tipo] } as CSSProperties}>
          <Icon name={icones[no.tipo]} size={17} />
        </span>
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
        <Icon name="trash" size={12} /> Excluir etapa
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
          <Icon name="plus" size={12} /> Adicionar
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
              <Icon name="x" size={13} />
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
