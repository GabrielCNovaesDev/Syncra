import { useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon, WhatsAppGlyph, type NomeIcone } from "../components/Icon";
import { ITENS_MARKETPLACE, formatarPreco } from "../data/marketplace";
import { useSessaoStore } from "../store/sessao";

const DEMO_NOS: { classe: string; icone: NomeIcone; texto: string; cor: string }[] = [
  { classe: "dn-1", icone: "message", texto: "Boas-vindas", cor: "#59a9ff" },
  { classe: "dn-2", icone: "help", texto: "Especialidade?", cor: "#a589ff" },
  { classe: "dn-3", icone: "sparkles", texto: "Resposta IA", cor: "#f6b963" },
  { classe: "dn-4", icone: "flag", texto: "Agendado", cor: "#f18c9a" },
];

const DEMO_LINHAS = [
  "M19 23 C 19 40, 22 50, 30 50",
  "M60 50 C 74 50, 81 38, 81 23",
  "M45 56 C 45 70, 42 81, 34 81",
];

const RECURSOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: "workflow", titulo: "Editor visual", texto: "Arraste etapas, conecte caminhos e veja a conversa tomar forma." },
  { icone: "sparkles", titulo: "IA quando precisa", texto: "Combine respostas fixas com etapas geradas por IA, com custo sob controle." },
  { icone: "play", titulo: "Teste na hora", texto: "Converse com o bot dentro do estúdio antes de publicar." },
  { icone: "shield", titulo: "Validação automática", texto: "Regras que impedem fluxos quebrados, laços infinitos e nós órfãos." },
  { icone: "store", titulo: "Marketplace", texto: "Comece de um modelo pronto para o seu segmento e personalize." },
  { icone: "plug", titulo: "Multicanal", texto: "WhatsApp hoje; site, Instagram e webhooks na sequência." },
];

const SEGMENTOS: { icone: NomeIcone; nome: string }[] = [
  { icone: "stethoscope", nome: "Clínicas" },
  { icone: "utensils", nome: "Restaurantes" },
  { icone: "building", nome: "Imobiliárias" },
  { icone: "cart", nome: "E-commerce" },
  { icone: "cap", nome: "Escolas" },
  { icone: "wallet", nome: "Financeiro" },
  { icone: "car", nome: "Oficinas" },
  { icone: "dumbbell", nome: "Academias" },
];

export function LandingPage() {
  const usuario = useSessaoStore((s) => s.usuario);
  const destino = usuario ? "/app" : "/entrar";

  // Ao abrir a landing com âncora (ex.: /#recursos), rola até a seção.
  useEffect(() => {
    if (!window.location.hash) return;
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, []);

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
        <span className="grid-fade" />
      </div>

      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={18} strokeWidth={2.4} />
          </span>
          <span>
            syncra bot<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav>
          <a href="#como-funciona">Como funciona</a>
          <a href="#recursos">Recursos</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#whatsapp">WhatsApp</a>
        </nav>
        <div className="landing-nav-actions">
          {usuario ? (
            <Link to="/app" className="button button-primary">
              Abrir painel <Icon name="arrowRight" size={14} />
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="nav-login">
                Entrar
              </Link>
              <Link to="/entrar" className="button button-primary">
                Começar grátis
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="pill-announce">
            <span>Novo</span> Integração com WhatsApp Business <Icon name="arrowRight" size={12} />
          </span>
          <h1>
            Chatbots inteligentes,
            <br />
            <span className="gradient-text">desenhados em minutos.</span>
          </h1>
          <p>
            O Syncra Bot é a plataforma para criar, testar e distribuir assistentes de conversa. Monte o
            fluxo visualmente, adicione IA onde faz diferença e publique no WhatsApp.
          </p>
          <div className="hero-ctas">
            <Link to={destino} className="button button-primary button-lg">
              Criar meu primeiro bot <Icon name="arrowRight" size={16} />
            </Link>
            <a href="#como-funciona" className="button button-ghost button-lg">
              <Icon name="play" size={14} filled /> Ver como funciona
            </a>
          </div>
          <div className="hero-proof">
            <div className="avatars">
              {["#b49cff", "#58d6b5", "#f6b963", "#59a9ff"].map((c, i) => (
                <span key={c} style={{ background: c }}>
                  {"ACMR"[i]}
                </span>
              ))}
            </div>
            <span>
              <strong>+2.300 negócios</strong> automatizando o atendimento
            </span>
          </div>
        </div>

        <div className="hero-demo" aria-hidden="true">
          <div className="demo-window">
            <div className="demo-bar">
              <i />
              <i />
              <i />
              <span>estúdio · Recepção de Clínica</span>
            </div>
            <div className="demo-canvas">
              {/* Coordenadas em % do canvas, alinhadas às posições dos nós no CSS. */}
              <svg className="demo-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                {DEMO_LINHAS.map((d, i) => (
                  <g key={d} style={{ "--i": i } as CSSProperties}>
                    <path className="dl" d={d} pathLength={1} />
                    <path className="dl-flow" d={d} pathLength={1} />
                  </g>
                ))}
              </svg>
              {DEMO_NOS.map((no, i) => (
                <div
                  key={no.classe}
                  className={`demo-node ${no.classe}`}
                  style={{ "--c": no.cor, "--i": i } as CSSProperties}
                >
                  <Icon name={no.icone} size={12} /> <span>{no.texto}</span>
                </div>
              ))}
              <div className="demo-cursor">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M4 3l16 8-7 2-3 7z" fill="#fff" stroke="#10111b" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
          <div className="demo-chat">
            <div className="demo-chat-head">
              <WhatsAppGlyph size={14} /> Clínica Vida
            </div>
            <div className="dc in" style={{ "--i": 0 } as CSSProperties}>
              Olá! Vou te ajudar a marcar sua consulta.
            </div>
            <div className="dc out" style={{ "--i": 1 } as CSSProperties}>
              Quero um dermatologista
            </div>
            <div className="dc in" style={{ "--i": 2 } as CSSProperties}>
              <Icon name="sparkles" size={10} /> Temos horários na quinta às 14h. Pode ser?
            </div>
            <div className="dc out" style={{ "--i": 3 } as CSSProperties}>
              Perfeito!
            </div>
            <div className="dc in dc-typing" style={{ "--i": 4 } as CSSProperties}>
              <i />
              <i />
              <i />
            </div>
          </div>
        </div>
      </section>

      <section className="segments">
        <span>Feito para quem atende todos os dias</span>
        <div className="segments-track">
          <div className="segments-row">
            {[...SEGMENTOS, ...SEGMENTOS].map((s, i) => (
              <span key={i}>
                <Icon name={s.icone} size={16} /> {s.nome}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="como-funciona">
        <div className="section-head">
          <span className="hero-kicker">COMO FUNCIONA</span>
          <h2>Do rascunho à conversa real em três passos.</h2>
        </div>
        <div className="steps-grid">
          {[
            { n: "01", icone: "workflow" as NomeIcone, t: "Desenhe", d: "Arraste mensagens, perguntas, condições e etapas de IA para montar a jornada." },
            { n: "02", icone: "play" as NomeIcone, t: "Teste", d: "Converse com o bot no simulador e veja o caminho percorrido no mapa." },
            { n: "03", icone: "send" as NomeIcone, t: "Publique", d: "Conecte seu número do WhatsApp e deixe o bot atender 24 horas por dia." },
          ].map((p) => (
            <div key={p.n} className="step-card">
              <div className="step-top">
                <span className="step-icon">
                  <Icon name={p.icone} size={20} />
                </span>
                <small>{p.n}</small>
              </div>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="recursos">
        <div className="section-head">
          <span className="hero-kicker">RECURSOS</span>
          <h2>Tudo o que um bot precisa, nada que atrapalhe.</h2>
        </div>
        <div className="features-landing">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="feature-tile">
              <span>
                <Icon name={r.icone} size={20} />
              </span>
              <h3>{r.titulo}</h3>
              <p>{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" id="marketplace">
        <div className="section-head">
          <span className="hero-kicker">MARKETPLACE</span>
          <h2>Não comece do zero.</h2>
          <p>Fluxos prontos, criados por especialistas, para adaptar ao seu negócio.</p>
        </div>
        <div className="landing-market">
          {ITENS_MARKETPLACE.filter((i) => i.emDestaque).map((item) => (
            <div
              key={item.id}
              className="landing-market-card"
              style={{ "--item-color": item.cor } as CSSProperties}
            >
              <span className="item-icon large">
                <Icon name={item.icone} size={22} />
              </span>
              <h3>{item.nome}</h3>
              <p>{item.resumo}</p>
              <div>
                <span className="rating">
                  <Icon name="star" size={12} filled /> {item.avaliacao.toFixed(1)}
                </span>
                <strong>{formatarPreco(item.precoMensal)}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section wa-band" id="whatsapp">
        <div>
          <span className="wa-badge">
            <WhatsAppGlyph size={16} /> WhatsApp Business Platform
          </span>
          <h2>Seu bot onde seus clientes já estão.</h2>
          <p>
            Conecte sua conta Meta Business com poucos cliques. O Syncra Bot recebe as mensagens,
            executa o fluxo e responde em segundos — com IA quando fizer sentido.
          </p>
          <ul>
            <li>
              <Icon name="check" size={14} strokeWidth={2.4} /> Cadastro incorporado da Meta
            </li>
            <li>
              <Icon name="check" size={14} strokeWidth={2.4} /> Webhook configurado automaticamente
            </li>
            <li>
              <Icon name="check" size={14} strokeWidth={2.4} /> Pause ou troque o bot a qualquer momento
            </li>
          </ul>
        </div>
        <div className="wa-band-stats">
          <div>
            <strong>24/7</strong>
            <small>atendimento sem fila</small>
          </div>
          <div>
            <strong>&lt; 3s</strong>
            <small>tempo médio de resposta</small>
          </div>
          <div>
            <strong>-62%</strong>
            <small>chamados repetitivos</small>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>
          Pronto para tirar seu bot do papel<span className="heading-dot">?</span>
        </h2>
        <p>Entre no ambiente de demonstração e crie seu primeiro fluxo agora.</p>
        <Link to={destino} className="button button-primary button-lg">
          Começar agora <Icon name="arrowRight" size={16} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} Syncra Bot · Ambiente de demonstração · métricas e depoimentos ilustrativos
        </span>
        <span>Feito com React Flow, Zod e muito café.</span>
      </footer>
    </div>
  );
}
