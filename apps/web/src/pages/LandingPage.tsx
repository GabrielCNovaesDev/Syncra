import { useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon, WhatsAppGlyph, type NomeIcone } from "../components/Icon";
import { ITENS_MARKETPLACE, formatarPreco } from "../data/marketplace";
import { useSessaoStore } from "../store/sessao";

/** Revela elementos `.reveal` conforme entram na tela. */
function useRevelarAoRolar() {
  useEffect(() => {
    const elementos = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      elementos.forEach((el) => el.classList.add("in"));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("in");
            observador.unobserve(entrada.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    elementos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, []);
}

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
  useRevelarAoRolar();
  const destino = usuario ? "/app" : "/entrar";

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
              <svg className="demo-lines" viewBox="0 0 420 300" preserveAspectRatio="none">
                <path className="dl dl-1" d="M120 62 C 170 62, 170 140, 215 140" />
                <path className="dl dl-2" d="M300 150 C 340 150, 330 230, 270 232" />
                <path className="dl dl-3" d="M300 150 C 360 150, 380 60, 330 52" />
              </svg>
              <div className="demo-node dn-1" style={{ "--c": "#59a9ff" } as CSSProperties}>
                <Icon name="message" size={12} /> Boas-vindas
              </div>
              <div className="demo-node dn-2" style={{ "--c": "#a589ff" } as CSSProperties}>
                <Icon name="help" size={12} /> Qual especialidade?
              </div>
              <div className="demo-node dn-3" style={{ "--c": "#f6b963" } as CSSProperties}>
                <Icon name="sparkles" size={12} /> Resposta com IA
              </div>
              <div className="demo-node dn-4" style={{ "--c": "#f18c9a" } as CSSProperties}>
                <Icon name="flag" size={12} /> Agendado
              </div>
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
            <div className="dc dc-1 in">Olá! Vou te ajudar a marcar sua consulta.</div>
            <div className="dc dc-2 out">Quero um dermatologista</div>
            <div className="dc dc-3 in">
              <Icon name="sparkles" size={10} /> Temos horários na quinta às 14h. Pode ser?
            </div>
            <div className="dc dc-4 out">Perfeito!</div>
          </div>
        </div>
      </section>

      <section className="segments reveal">
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
        <div className="section-head reveal">
          <span className="hero-kicker">COMO FUNCIONA</span>
          <h2>Do rascunho à conversa real em três passos.</h2>
        </div>
        <div className="steps-grid">
          {[
            { n: "01", icone: "workflow" as NomeIcone, t: "Desenhe", d: "Arraste mensagens, perguntas, condições e etapas de IA para montar a jornada." },
            { n: "02", icone: "play" as NomeIcone, t: "Teste", d: "Converse com o bot no simulador e veja o caminho percorrido no mapa." },
            { n: "03", icone: "send" as NomeIcone, t: "Publique", d: "Conecte seu número do WhatsApp e deixe o bot atender 24 horas por dia." },
          ].map((p, i) => (
            <div key={p.n} className="step-card reveal" style={{ transitionDelay: `${i * 120}ms` }}>
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
        <div className="section-head reveal">
          <span className="hero-kicker">RECURSOS</span>
          <h2>Tudo o que um bot precisa, nada que atrapalhe.</h2>
        </div>
        <div className="features-landing">
          {RECURSOS.map((r, i) => (
            <div key={r.titulo} className="feature-tile reveal" style={{ transitionDelay: `${i * 70}ms` }}>
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
        <div className="section-head reveal">
          <span className="hero-kicker">MARKETPLACE</span>
          <h2>Não comece do zero.</h2>
          <p>Fluxos prontos, criados por especialistas, para adaptar ao seu negócio.</p>
        </div>
        <div className="landing-market">
          {ITENS_MARKETPLACE.filter((i) => i.emDestaque).map((item, i) => (
            <div
              key={item.id}
              className="landing-market-card reveal"
              style={{ "--item-color": item.cor, transitionDelay: `${i * 100}ms` } as CSSProperties}
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

      <section className="landing-section wa-band reveal" id="whatsapp">
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

      <section className="final-cta reveal">
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
