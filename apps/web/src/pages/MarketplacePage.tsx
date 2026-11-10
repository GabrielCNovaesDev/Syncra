import { Background, ReactFlow, ReactFlowProvider, type Edge, type Node, type NodeTypes } from "@xyflow/react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlowNode, type FlowNodeData } from "../components/FlowNode";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import {
  CATEGORIAS,
  ITENS_MARKETPLACE,
  carregarAdquiridos,
  formatarNumero,
  formatarPreco,
  salvarAdquiridos,
  type CategoriaMarketplace,
  type ItemMarketplace,
} from "../data/marketplace";
import { cores, useStudioStore } from "../store/studio";
import { useBotsStore } from "../store/bots";
import { toast } from "../store/toast";

type Ordem = "populares" | "avaliados" | "novos";
type FiltroPreco = "todos" | "gratis" | "pagos";

const nodeTypes: NodeTypes = { syncra: FlowNode as unknown as NodeTypes[string] };

export function MarketplacePage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<CategoriaMarketplace | "Todos">("Todos");
  const [preco, setPreco] = useState<FiltroPreco>("todos");
  const [ordem, setOrdem] = useState<Ordem>("populares");
  const [aberto, setAberto] = useState<ItemMarketplace | null>(null);
  const [adquiridos, setAdquiridos] = useState<string[]>(carregarAdquiridos);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = ITENS_MARKETPLACE.filter((item) => {
      if (categoria !== "Todos" && item.categoria !== categoria) return false;
      if (preco === "gratis" && item.precoMensal > 0) return false;
      if (preco === "pagos" && item.precoMensal === 0) return false;
      if (!termo) return true;
      return [item.nome, item.resumo, item.autor, item.categoria, ...item.destaques]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
    return [...lista].sort((a, b) => {
      if (ordem === "avaliados") return b.avaliacao - a.avaliacao;
      if (ordem === "novos") return Number(Boolean(b.novo)) - Number(Boolean(a.novo));
      return b.instalacoes - a.instalacoes;
    });
  }, [busca, categoria, preco, ordem]);

  const destaques = ITENS_MARKETPLACE.filter((i) => i.emDestaque);
  const filtrando = busca.trim() !== "" || categoria !== "Todos" || preco !== "todos";

  function registrarAquisicao(id: string) {
    const proximos = adquiridos.includes(id) ? adquiridos : [...adquiridos, id];
    setAdquiridos(proximos);
    salvarAdquiridos(proximos);
  }

  return (
    <div className="page market-page page-enter">
      <section className="market-hero">
        <div className="market-hero-glow" />
        <div className="market-hero-copy">
          <span className="hero-kicker">
            <Icon name="store" size={12} /> MARKETPLACE DE FLUXOS
          </span>
          <h1>
            Comece com um fluxo que <em>já funciona.</em>
          </h1>
          <p>
            Modelos criados por especialistas para cada segmento. Adquira, personalize no estúdio e
            conecte ao WhatsApp em minutos.
          </p>
          <label className="market-search">
            <Icon name="search" size={17} />
            <input
              value={busca}
              placeholder="Busque por segmento, objetivo ou autor…"
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca ? (
              <button type="button" aria-label="Limpar busca" onClick={() => setBusca("")}>
                <Icon name="x" size={14} />
              </button>
            ) : (
              null
            )}
          </label>
          <div className="market-hero-stats">
            <span>
              <strong>{ITENS_MARKETPLACE.length}</strong> fluxos
            </span>
            <span>
              <strong>{CATEGORIAS.length}</strong> segmentos
            </span>
            <span>
              <strong>
                {formatarNumero(ITENS_MARKETPLACE.reduce((t, i) => t + i.instalacoes, 0))}
              </strong>{" "}
              instalações
            </span>
          </div>
        </div>
        <div className="market-hero-cards" aria-hidden="true">
          {destaques.map((item, i) => (
            <div
              key={item.id}
              className={`floating-card fc-${i}`}
              style={{ "--item-color": item.cor } as CSSProperties}
            >
              <span>
                <Icon name={item.icone} size={18} />
              </span>
              <strong>{item.nome}</strong>
              <small>
                <Icon name="star" size={10} filled /> {item.avaliacao.toFixed(1)}
              </small>
            </div>
          ))}
        </div>
      </section>

      <div className="demo-ribbon">
        <Icon name="info" size={14} /> Ambiente de demonstração: catálogo e pagamentos são simulados
        localmente, nenhuma cobrança é feita.
      </div>

      {!filtrando ? (
        <>
          <div className="section-title">
            <div>
              <h2>Em destaque</h2>
              <p>Os fluxos mais instalados da semana.</p>
            </div>
          </div>
          <div className="featured-grid">
            {destaques.map((item) => (
              <CartaoDestaque
                key={item.id}
                item={item}
                adquirido={adquiridos.includes(item.id)}
                aoAbrir={() => setAberto(item)}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="market-toolbar">
        <div className="chip-row" role="tablist" aria-label="Categorias">
          {(["Todos", ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={categoria === c}
              className={categoria === c ? "chip active" : "chip"}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="market-selects">
          <select
            aria-label="Filtrar por preço"
            value={preco}
            onChange={(e) => setPreco(e.target.value as FiltroPreco)}
          >
            <option value="todos">Todos os preços</option>
            <option value="gratis">Grátis</option>
            <option value="pagos">Pagos</option>
          </select>
          <select
            aria-label="Ordenar"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
          >
            <option value="populares">Mais populares</option>
            <option value="avaliados">Melhor avaliados</option>
            <option value="novos">Novidades</option>
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="market-empty">
          <Icon name="search" size={26} />
          <strong>Nenhum fluxo encontrado</strong>
          <p>Tente outro termo ou limpe os filtros.</p>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              setBusca("");
              setCategoria("Todos");
              setPreco("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="market-grid">
          {filtrados.map((item, i) => (
            <CartaoItem
              key={item.id}
              item={item}
              indice={i}
              adquirido={adquiridos.includes(item.id)}
              aoAbrir={() => setAberto(item)}
            />
          ))}
        </div>
      )}

      {aberto ? (
        <DetalheItem
          item={aberto}
          adquirido={adquiridos.includes(aberto.id)}
          aoFechar={() => setAberto(null)}
          aoAdquirir={() => registrarAquisicao(aberto.id)}
        />
      ) : null}
    </div>
  );
}

function Avaliacao({ item }: { item: ItemMarketplace }) {
  return (
    <span className="rating">
      <Icon name="star" size={12} filled /> {item.avaliacao.toFixed(1)}
      <small>({item.avaliacoes})</small>
    </span>
  );
}

function CartaoDestaque({
  item,
  adquirido,
  aoAbrir,
}: {
  item: ItemMarketplace;
  adquirido: boolean;
  aoAbrir: () => void;
}) {
  return (
    <button
      type="button"
      className="featured-card"
      style={{ "--item-color": item.cor } as CSSProperties}
      onClick={aoAbrir}
    >
      <div className="featured-top">
        <span className="item-icon large">
          <Icon name={item.icone} size={24} />
        </span>
        <span className="price-tag">{adquirido ? "Instalado" : formatarPreco(item.precoMensal)}</span>
      </div>
      <h3>{item.nome}</h3>
      <p>{item.resumo}</p>
      <div className="mini-steps">
        {item.definicao.nos.slice(0, 5).map((no) => (
          <i key={no.id} style={{ background: cores[no.tipo] }} title={no.tipo} />
        ))}
        <small>{item.definicao.nos.length} etapas</small>
      </div>
      <div className="featured-foot">
        <Avaliacao item={item} />
        <span>
          <Icon name="download" size={12} /> {formatarNumero(item.instalacoes)}
        </span>
      </div>
    </button>
  );
}

function CartaoItem({
  item,
  indice,
  adquirido,
  aoAbrir,
}: {
  item: ItemMarketplace;
  indice: number;
  adquirido: boolean;
  aoAbrir: () => void;
}) {
  return (
    <button
      type="button"
      className="market-card"
      style={{ "--item-color": item.cor, animationDelay: `${indice * 45}ms` } as CSSProperties}
      onClick={aoAbrir}
    >
      <div className="market-card-head">
        <span className="item-icon">
          <Icon name={item.icone} size={19} />
        </span>
        <div>
          <strong>{item.nome}</strong>
          <small>
            {item.autor}
            {item.verificado ? <Icon name="checkCircle" size={11} className="verified" /> : null}
          </small>
        </div>
        {item.novo ? <span className="badge-new">Novo</span> : null}
      </div>
      <p>{item.resumo}</p>
      <div className="market-card-tags">
        <span>{item.categoria}</span>
        {item.canais.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className="market-card-foot">
        <Avaliacao item={item} />
        <span className={adquirido ? "price owned" : item.precoMensal === 0 ? "price free" : "price"}>
          {adquirido ? (
            <>
              <Icon name="check" size={12} /> Instalado
            </>
          ) : (
            formatarPreco(item.precoMensal)
          )}
        </span>
      </div>
    </button>
  );
}

type EtapaCompra = "detalhe" | "checkout" | "processando" | "concluido";

function DetalheItem({
  item,
  adquirido,
  aoFechar,
  aoAdquirir,
}: {
  item: ItemMarketplace;
  adquirido: boolean;
  aoFechar: () => void;
  aoAdquirir: () => void;
}) {
  const navigate = useNavigate();
  const carregarDefinicao = useStudioStore((s) => s.carregarDefinicao);
  const novoBot = useBotsStore((s) => s.novo);
  const [etapa, setEtapa] = useState<EtapaCompra>("detalhe");

  function abrirNoEstudio() {
    novoBot();
    carregarDefinicao(item.definicao);
    toast.sucesso("Fluxo carregado no estúdio", `“${item.nome}” está pronto para personalizar.`);
    navigate("/app/studio");
  }

  function acaoPrincipal() {
    if (adquirido || item.precoMensal === 0) {
      aoAdquirir();
      abrirNoEstudio();
      return;
    }
    setEtapa("checkout");
  }

  function pagar() {
    setEtapa("processando");
    window.setTimeout(() => {
      aoAdquirir();
      setEtapa("concluido");
    }, 1600);
  }

  return (
    <Modal
      rotulo={item.nome}
      className={etapa === "detalhe" ? "market-modal" : "market-modal compact"}
      style={{ "--item-color": item.cor } as CSSProperties}
      aoFechar={etapa === "processando" ? undefined : aoFechar}
    >
        {etapa !== "processando" ? (
          <button type="button" className="modal-close" aria-label="Fechar" onClick={aoFechar}>
            <Icon name="x" size={16} />
          </button>
        ) : null}

        {etapa === "detalhe" ? (
          <div className="market-detail">
            <div className="market-detail-main">
              <div className="market-detail-head">
                <span className="item-icon large">
                  <Icon name={item.icone} size={26} />
                </span>
                <div>
                  <span className="detail-category">{item.categoria}</span>
                  <h2>{item.nome}</h2>
                  <small>
                    por <strong>{item.autor}</strong>
                    {item.verificado ? (
                      <span className="verified-tag">
                        <Icon name="checkCircle" size={11} /> Verificado
                      </span>
                    ) : null}
                  </small>
                </div>
              </div>
              <p className="detail-description">{item.descricao}</p>

              <div className="flow-preview">
                <ReactFlowProvider>
                  <PreviaFluxo item={item} />
                </ReactFlowProvider>
                <span className="flow-preview-label">
                  <Icon name="eye" size={12} /> Prévia do fluxo
                </span>
              </div>

              <ul className="detail-highlights">
                {item.destaques.map((d) => (
                  <li key={d}>
                    <Icon name="check" size={13} strokeWidth={2.4} /> {d}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="market-detail-side">
              <div className="detail-price">
                {item.precoMensal === 0 ? (
                  <strong>Grátis</strong>
                ) : (
                  <>
                    <strong>R$ {item.precoMensal}</strong>
                    <small>/mês</small>
                  </>
                )}
              </div>
              <button type="button" className="button button-primary block" onClick={acaoPrincipal}>
                {adquirido ? (
                  <>
                    <Icon name="workflow" size={15} /> Abrir no estúdio
                  </>
                ) : item.precoMensal === 0 ? (
                  <>
                    <Icon name="download" size={15} /> Usar este fluxo
                  </>
                ) : (
                  <>
                    <Icon name="cart" size={15} /> Assinar fluxo
                  </>
                )}
              </button>
              <p className="detail-warning">
                <Icon name="info" size={12} /> Ao abrir, o rascunho atual do estúdio é substituído.
                Exporte-o antes se quiser guardar.
              </p>
              <dl className="detail-facts">
                <div>
                  <dt>Avaliação</dt>
                  <dd>
                    <Avaliacao item={item} />
                  </dd>
                </div>
                <div>
                  <dt>Instalações</dt>
                  <dd>{item.instalacoes.toLocaleString("pt-BR")}</dd>
                </div>
                <div>
                  <dt>Etapas</dt>
                  <dd>{item.definicao.nos.length}</dd>
                </div>
                <div>
                  <dt>Variáveis</dt>
                  <dd>{item.definicao.variaveis.length}</dd>
                </div>
                <div>
                  <dt>Canais</dt>
                  <dd>{item.canais.join(", ")}</dd>
                </div>
              </dl>
            </aside>
          </div>
        ) : null}

        {etapa === "checkout" ? (
          <div className="checkout">
            <span className="checkout-kicker">
              <Icon name="lock" size={12} /> CHECKOUT SANDBOX · MERCADO PAGO
            </span>
            <h2>Confirmar assinatura</h2>
            <div className="checkout-line">
              <span className="item-icon">
                <Icon name={item.icone} size={18} />
              </span>
              <div>
                <strong>{item.nome}</strong>
                <small>Assinatura mensal · cancele quando quiser</small>
              </div>
              <strong>R$ {item.precoMensal},00</strong>
            </div>
            <div className="checkout-method">
              <Icon name="wallet" size={16} />
              <span>Pagamento simulado (sandbox)</span>
              <small>Nenhum dado de cartão é solicitado nesta demonstração.</small>
            </div>
            <div className="checkout-total">
              <span>Total hoje</span>
              <strong>R$ {item.precoMensal},00</strong>
            </div>
            <div className="checkout-actions">
              <button type="button" className="button button-ghost" onClick={() => setEtapa("detalhe")}>
                Voltar
              </button>
              <button type="button" className="button button-primary" onClick={pagar}>
                <Icon name="lock" size={14} /> Confirmar pagamento simulado
              </button>
            </div>
          </div>
        ) : null}

        {etapa === "processando" ? (
          <div className="checkout-state">
            <span className="spinner" />
            <h2>Processando pagamento…</h2>
            <p>Comunicando com o ambiente sandbox.</p>
          </div>
        ) : null}

        {etapa === "concluido" ? (
          <div className="checkout-state success">
            <span className="success-burst">
              <Icon name="check" size={30} strokeWidth={2.6} />
            </span>
            <h2>Assinatura confirmada!</h2>
            <p>“{item.nome}” agora faz parte do seu workspace.</p>
            <button type="button" className="button button-primary" onClick={abrirNoEstudio}>
              <Icon name="workflow" size={15} /> Abrir no estúdio
            </button>
          </div>
        ) : null}
    </Modal>
  );
}

function PreviaFluxo({ item }: { item: ItemMarketplace }) {
  const { nodes, edges } = useMemo(() => {
    const def = item.definicao;
    const nodes: Node[] = def.nos.map((no) => ({
      id: no.id,
      type: "syncra",
      position: def.metadados_editor?.posicoes[no.id] ?? { x: 0, y: 0 },
      data: { no, inicial: def.no_inicial === no.id, erros: 0, ativo: false } satisfies FlowNodeData,
      draggable: false,
      selectable: false,
    }));
    const edges: Edge[] = def.conexoes.map((c, i) => {
      const origem = def.nos.find((n) => n.id === c.de);
      return {
        id: `p-${i}`,
        source: c.de,
        target: c.para,
        type: "smoothstep",
        label: c.condicao ?? undefined,
        style: { stroke: origem ? cores[origem.tipo] : "#888", strokeWidth: 1.6 },
      };
    });
    return { nodes, edges };
  }, [item]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      nodesConnectable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      panOnScroll
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={18} size={1} color="#2c2f40" />
    </ReactFlow>
  );
}
