import { estadoInicial, interpretarTurno } from "@syncra/engine";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon, MetaGlyph, WhatsAppGlyph, type NomeIcone } from "../components/Icon";
import { Modal } from "../components/Modal";
import { ITENS_MARKETPLACE, carregarAdquiridos } from "../data/marketplace";
import {
  gerarIdNumerico,
  gerarVerifyToken,
  useIntegracoesStore,
  type ConexaoWhatsApp,
} from "../store/integracoes";
import { useSessaoStore } from "../store/sessao";
import { useStudioStore } from "../store/studio";
import { toast } from "../store/toast";

const OUTRAS: { nome: string; descricao: string; icone: NomeIcone; cor: string; status: string }[] = [
  { nome: "Widget para site", descricao: "Chat flutuante instalado com uma linha de código.", icone: "globe", cor: "#59a9ff", status: "Em breve" },
  { nome: "Instagram Direct", descricao: "Responda DMs e comentários automaticamente.", icone: "heart", cor: "#f18c9a", status: "Em breve" },
  { nome: "Webhooks", descricao: "Envie eventos da conversa para o seu sistema.", icone: "link", cor: "#a589ff", status: "Em breve" },
  { nome: "E-mail", descricao: "Receba resumos e leads qualificados por e-mail.", icone: "mail", cor: "#f6b963", status: "Em breve" },
];

export function IntegracoesPage() {
  const whatsapp = useIntegracoesStore((s) => s.whatsapp);
  const [assistenteAberto, setAssistenteAberto] = useState(false);

  return (
    <div className="page integrations-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CANAIS E CONEXÕES</div>
          <h1>
            Integrações<span className="heading-dot">.</span>
          </h1>
          <p>Conecte seus bots aos canais onde seus clientes já estão.</p>
        </div>
        <span className="section-tag">SIMULAÇÃO</span>
      </div>

      {whatsapp ? (
        <PainelConectado conexao={whatsapp} />
      ) : (
        <section className="wa-hero">
          <div className="wa-hero-copy">
            <span className="wa-badge">
              <WhatsAppGlyph size={16} /> WhatsApp Business Platform
            </span>
            <h2>Seu bot no WhatsApp em 4 passos.</h2>
            <p>
              Conecte sua conta Meta Business, escolha o número e o Syncra Bot passa a responder
              automaticamente usando o fluxo que você desenhou.
            </p>
            <ol className="wa-steps">
              <li>
                <span>1</span> Entrar com a conta Meta Business
              </li>
              <li>
                <span>2</span> Selecionar conta WhatsApp e número
              </li>
              <li>
                <span>3</span> Configurar webhook e token
              </li>
              <li>
                <span>4</span> Vincular um bot e testar
              </li>
            </ol>
            <button
              type="button"
              className="button button-whatsapp"
              onClick={() => setAssistenteAberto(true)}
            >
              <WhatsAppGlyph size={17} /> Conectar WhatsApp
            </button>
          </div>
          <div className="wa-hero-visual" aria-hidden="true">
            <div className="wa-orbit">
              <span className="wa-core">
                <WhatsAppGlyph size={40} />
              </span>
              <span className="wa-sat sat-1">
                <Icon name="bot" size={18} />
              </span>
              <span className="wa-sat sat-2">
                <MetaGlyph size={18} />
              </span>
              <span className="wa-sat sat-3">
                <Icon name="zap" size={18} />
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="section-title">
        <div>
          <h2>Outros canais</h2>
          <p>Mais formas de distribuir seus bots.</p>
        </div>
      </div>
      <div className="integration-grid">
        {OUTRAS.map((o) => (
          <div key={o.nome} className="integration-card" style={{ "--item-color": o.cor } as CSSProperties}>
            <span className="item-icon">
              <Icon name={o.icone} size={19} />
            </span>
            <div>
              <strong>{o.nome}</strong>
              <p>{o.descricao}</p>
            </div>
            <span className="soon-tag">{o.status}</span>
          </div>
        ))}
      </div>

      {assistenteAberto ? <AssistenteConexao aoFechar={() => setAssistenteAberto(false)} /> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Assistente */

type Passo = "login" | "conta" | "credenciais" | "verificando";

const EMPRESAS = ["Minha Empresa Ltda", "Loja Demonstração", "Clínica Exemplo"];
const NUMEROS = [
  { numero: "+55 11 94000-1234", nome: "Atendimento" },
  { numero: "+55 21 93000-5678", nome: "Vendas" },
];

const CHECAGENS = [
  "Validando token de acesso",
  "Inscrevendo webhook no campo messages",
  "Verificando número e qualidade",
  "Registrando o número na Cloud API",
];

function AssistenteConexao({ aoFechar }: { aoFechar: () => void }) {
  const usuario = useSessaoStore((s) => s.usuario);
  const nomeBot = useStudioStore((s) => s.definicao.nome);
  const conectarWhatsApp = useIntegracoesStore((s) => s.conectarWhatsApp);

  const [passo, setPasso] = useState<Passo>("login");
  const [autorizando, setAutorizando] = useState(false);
  const [empresa, setEmpresa] = useState(EMPRESAS[0]!);
  const [numero, setNumero] = useState(NUMEROS[0]!.numero);
  const [token, setToken] = useState("");
  const [concluidas, setConcluidas] = useState(0);

  const ids = useMemo(
    () => ({ waba: gerarIdNumerico(15), phone: gerarIdNumerico(15), verify: gerarVerifyToken() }),
    [],
  );
  const webhookUrl = "https://api.syncra.bot/webhooks/whatsapp";

  useEffect(() => {
    if (passo !== "verificando") return;
    if (concluidas >= CHECAGENS.length) {
      const t = window.setTimeout(() => {
        const nomeNumero = NUMEROS.find((n) => n.numero === numero)?.nome ?? "Atendimento";
        const conexao: ConexaoWhatsApp = {
          numero,
          nomeExibicao: `${empresa} · ${nomeNumero}`,
          empresa,
          wabaId: ids.waba,
          phoneNumberId: ids.phone,
          tokenFinal: token.trim().slice(-4) || "demo",
          verifyToken: ids.verify,
          botVinculado: nomeBot,
          botAtivo: true,
          conectadoEm: new Date().toISOString(),
        };
        conectarWhatsApp(conexao);
        toast.sucesso("WhatsApp conectado", `${numero} já está respondendo com “${nomeBot}”.`);
        aoFechar();
      }, 600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setConcluidas((c) => c + 1), 750);
    return () => window.clearTimeout(t);
  }, [passo, concluidas, numero, empresa, ids, token, nomeBot, conectarWhatsApp, aoFechar]);

  function autorizar() {
    setAutorizando(true);
    window.setTimeout(() => {
      setAutorizando(false);
      setPasso("conta");
    }, 1300);
  }

  const indice = ["login", "conta", "credenciais", "verificando"].indexOf(passo);

  return (
    <Modal
      rotulo="Conectar WhatsApp"
      className="wa-modal"
      aoFechar={passo === "verificando" ? undefined : aoFechar}
    >
        {passo !== "verificando" ? (
          <button type="button" className="modal-close" aria-label="Fechar" onClick={aoFechar}>
            <Icon name="x" size={16} />
          </button>
        ) : null}

        <div className="wizard-progress">
          {["Conta Meta", "Número", "Credenciais", "Verificação"].map((rotulo, i) => (
            <div key={rotulo} className={i < indice ? "done" : i === indice ? "current" : ""}>
              <span>{i < indice ? <Icon name="check" size={11} strokeWidth={3} /> : i + 1}</span>
              <small>{rotulo}</small>
            </div>
          ))}
        </div>

        {passo === "login" ? (
          <div className="wizard-body meta-consent">
            <span className="meta-mark">
              <MetaGlyph size={30} />
            </span>
            <h2>Cadastro incorporado da Meta</h2>
            <p className="muted">
              Simulação da janela de autorização. Na versão real, ela abre em um pop-up da Meta e o
              Syncra Bot nunca vê sua senha.
            </p>
            <div className="consent-user">
              <span className="profile-avatar">{(usuario?.nome ?? "V").charAt(0)}</span>
              <div>
                <strong>Continuar como {usuario?.nome ?? "Visitante"}</strong>
                <small>{usuario?.email ?? "visitante@syncra.bot"}</small>
              </div>
            </div>
            <div className="consent-perms">
              <span>O Syncra Bot solicitará:</span>
              <ul>
                <li>
                  <Icon name="checkCircle" size={14} /> Gerenciar contas do WhatsApp Business
                </li>
                <li>
                  <Icon name="checkCircle" size={14} /> Enviar e receber mensagens
                </li>
                <li>
                  <Icon name="checkCircle" size={14} /> Ler dados do portfólio empresarial
                </li>
              </ul>
            </div>
            <button type="button" className="button button-meta block" onClick={autorizar} disabled={autorizando}>
              {autorizando ? (
                <>
                  <span className="spinner small" /> Autorizando…
                </>
              ) : (
                <>
                  <MetaGlyph size={16} /> Autorizar acesso (simulado)
                </>
              )}
            </button>
          </div>
        ) : null}

        {passo === "conta" ? (
          <div className="wizard-body">
            <h2>Escolha a conta e o número</h2>
            <p className="muted">Encontramos estes ativos no seu portfólio empresarial.</p>
            <label className="field">
              Portfólio empresarial
              <select value={empresa} onChange={(e) => setEmpresa(e.target.value)}>
                {EMPRESAS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </label>
            <div className="field">
              Número do WhatsApp
              <div className="number-options">
                {NUMEROS.map((n) => (
                  <button
                    key={n.numero}
                    type="button"
                    className={numero === n.numero ? "number-option selected" : "number-option"}
                    onClick={() => setNumero(n.numero)}
                  >
                    <Icon name="phone" size={16} />
                    <span>
                      <strong>{n.numero}</strong>
                      <small>{n.nome} · Verificado</small>
                    </span>
                    <i />
                  </button>
                ))}
              </div>
            </div>
            <div className="wizard-actions">
              <button type="button" className="button button-ghost" onClick={() => setPasso("login")}>
                Voltar
              </button>
              <button type="button" className="button button-primary" onClick={() => setPasso("credenciais")}>
                Continuar <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </div>
        ) : null}

        {passo === "credenciais" ? (
          <div className="wizard-body">
            <h2>Webhook e credenciais</h2>
            <p className="muted">
              Preenchemos os IDs automaticamente. Cole estes dados no painel do app da Meta em{" "}
              <em>WhatsApp → Configuração</em>.
            </p>
            <CampoCopiavel rotulo="URL de callback" valor={webhookUrl} />
            <CampoCopiavel rotulo="Token de verificação" valor={ids.verify} />
            <div className="field-row">
              <CampoCopiavel rotulo="WhatsApp Business Account ID" valor={ids.waba} />
              <CampoCopiavel rotulo="Phone Number ID" valor={ids.phone} />
            </div>
            <label className="field">
              Token de acesso permanente <span className="optional">opcional na demonstração</span>
              <input
                type="password"
                autoComplete="off"
                placeholder="EAAG…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <small>
                <Icon name="shield" size={11} /> Não use um token real aqui. Nesta simulação nada sai
                do navegador e o token não é salvo — guardamos só os 4 últimos caracteres.
              </small>
            </label>
            <div className="wizard-actions">
              <button type="button" className="button button-ghost" onClick={() => setPasso("conta")}>
                Voltar
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setConcluidas(0);
                  setPasso("verificando");
                }}
              >
                Verificar e conectar <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </div>
        ) : null}

        {passo === "verificando" ? (
          <div className="wizard-body">
            <h2>Verificando conexão</h2>
            <p className="muted">Isso leva só alguns segundos.</p>
            <ul className="check-list">
              {CHECAGENS.map((c, i) => (
                <li key={c} className={i < concluidas ? "ok" : i === concluidas ? "running" : ""}>
                  <span>
                    {i < concluidas ? (
                      <Icon name="check" size={12} strokeWidth={3} />
                    ) : i === concluidas ? (
                      <i className="spinner tiny" />
                    ) : null}
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
    </Modal>
  );
}

function CampoCopiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="field">
      {rotulo}
      <div className="copy-field">
        <code>{valor}</code>
        <button
          type="button"
          aria-label={`Copiar ${rotulo}`}
          onClick={() => {
            void navigator.clipboard?.writeText(valor);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1400);
          }}
        >
          <Icon name={copiado ? "check" : "copy"} size={13} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Conectado */

function PainelConectado({ conexao }: { conexao: ConexaoWhatsApp }) {
  const definicao = useStudioStore((s) => s.definicao);
  const atualizarWhatsApp = useIntegracoesStore((s) => s.atualizarWhatsApp);
  const desconectarWhatsApp = useIntegracoesStore((s) => s.desconectarWhatsApp);

  const opcoesBot = useMemo(() => {
    const adquiridos = carregarAdquiridos();
    const nomes = [
      definicao.nome,
      ...ITENS_MARKETPLACE.filter((i) => adquiridos.includes(i.id)).map((i) => i.nome),
    ];
    if (!nomes.includes(conexao.botVinculado)) nomes.push(conexao.botVinculado);
    return [...new Set(nomes)];
  }, [definicao.nome, conexao.botVinculado]);

  const previa = useMemo(() => {
    const def =
      conexao.botVinculado === definicao.nome
        ? definicao
        : ITENS_MARKETPLACE.find((i) => i.nome === conexao.botVinculado)?.definicao ?? definicao;
    try {
      return interpretarTurno(def, estadoInicial(def))
        .acoes.filter((a) => a.tipo !== "chamar_ia")
        .map((a) => ("texto" in a ? a.texto : ""));
    } catch {
      return ["Olá! Como posso ajudar?"];
    }
  }, [conexao.botVinculado, definicao]);

  const conectadoEm = new Date(conexao.conectadoEm).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <section className="wa-connected">
      <div className="wa-connected-main">
        <div className="wa-connected-head">
          <span className="wa-logo">
            <WhatsAppGlyph size={26} />
          </span>
          <div>
            <strong>{conexao.numero}</strong>
            <small>{conexao.nomeExibicao}</small>
          </div>
          <span className="status-pill online">
            <i /> Conectado
          </span>
        </div>

        <div className="wa-metrics">
          <div>
            <small>Qualidade do número</small>
            <strong className="good">Alta</strong>
          </div>
          <div>
            <small>Limite de conversas</small>
            <strong>1 mil / 24h</strong>
          </div>
          <div>
            <small>Webhook</small>
            <strong className="good">Ativo</strong>
          </div>
          <div>
            <small>Conectado em</small>
            <strong>{conectadoEm}</strong>
          </div>
        </div>

        <div className="wa-bind">
          <label className="field">
            Bot que responde neste número
            <select
              value={conexao.botVinculado}
              onChange={(e) => {
                atualizarWhatsApp({ botVinculado: e.target.value });
                toast.info("Bot vinculado atualizado", e.target.value);
              }}
            >
              {opcoesBot.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="switch-field">
            <input
              type="checkbox"
              checked={conexao.botAtivo}
              onChange={(e) => atualizarWhatsApp({ botAtivo: e.target.checked })}
            />
            <span className="switch" />
            Respostas automáticas {conexao.botAtivo ? "ligadas" : "pausadas"}
          </label>
        </div>

        <dl className="wa-ids">
          <div>
            <dt>WABA ID</dt>
            <dd>{conexao.wabaId}</dd>
          </div>
          <div>
            <dt>Phone Number ID</dt>
            <dd>{conexao.phoneNumberId}</dd>
          </div>
          <div>
            <dt>Token</dt>
            <dd>••••••••{conexao.tokenFinal}</dd>
          </div>
        </dl>

        <div className="wa-actions">
          <Link to="/app/studio" className="button button-ghost">
            <Icon name="workflow" size={14} /> Editar fluxo
          </Link>
          <button
            type="button"
            className="button button-danger"
            onClick={() => {
              desconectarWhatsApp();
              toast.info("WhatsApp desconectado", "O número deixou de receber respostas automáticas.");
            }}
          >
            Desconectar
          </button>
        </div>
      </div>

      <div className="phone-mock" aria-label="Prévia no WhatsApp">
        <div className="phone-notch" />
        <div className="phone-header">
          <span className="phone-avatar">
            <Icon name="bot" size={15} />
          </span>
          <div>
            <strong>{conexao.empresa}</strong>
            <small>{conexao.botAtivo ? "online" : "visto por último hoje"}</small>
          </div>
        </div>
        <div className="phone-chat">
          <div className="phone-msg out">Oi! Vi o anúncio de vocês 👋</div>
          {conexao.botAtivo ? (
            previa.map((texto, i) => (
              <div key={i} className="phone-msg in" style={{ animationDelay: `${0.4 + i * 0.6}s` }}>
                {texto}
              </div>
            ))
          ) : (
            <div className="phone-system">Respostas automáticas pausadas</div>
          )}
        </div>
        <div className="phone-input">
          <span>Mensagem</span>
          <Icon name="send" size={14} />
        </div>
      </div>
    </section>
  );
}
