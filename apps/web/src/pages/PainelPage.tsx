import { Link } from "react-router-dom";
import { useStudioStore } from "../store/studio";

export function PainelPage() {
  const definicao = useStudioStore((s) => s.definicao);
  const valida = useStudioStore((s) => s.valida);

  return (
    <div className="page overview-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEU WORKSPACE</div>
          <h1>
            Visão geral<span className="heading-dot">.</span>
          </h1>
          <p>Um lugar para desenhar conversas que fazem sentido.</p>
        </div>
        <Link className="button button-primary" to="/studio">
          <span>＋</span> Abrir estúdio
        </Link>
      </div>

      <section className="hero-panel">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <span className="hero-kicker">✦ CRIE COM CLAREZA</span>
          <h2>
            Boas conversas
            <br />
            começam com um <em>bom fluxo.</em>
          </h2>
          <p>Monte etapas, conecte decisões e prepare seu assistente para responder do seu jeito.</p>
          <Link className="hero-link" to="/studio">
            Continuar no estúdio <span>↗</span>
          </Link>
        </div>
        <div className="hero-art">
          <div className="art-node art-first">
            <i />
            Mensagem de boas-vindas
          </div>
          <div className="art-line" />
          <div className="art-node art-second">
            <i />
            Pergunta ao usuário
          </div>
          <div className="art-line" />
          <div className="art-node art-third">
            <i />
            Resposta com IA
          </div>
        </div>
      </section>

      <div className="section-title">
        <div>
          <h2>Seu trabalho</h2>
          <p>Acompanhe o que já está tomando forma.</p>
        </div>
        <span className="section-tag">RASCUNHO LOCAL</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon blue">◇</span>
          <span className="stat-label">Fluxos em edição</span>
          <strong>01</strong>
          <small>Salvo neste navegador</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon purple">▤</span>
          <span className="stat-label">Etapas no fluxo</span>
          <strong>{String(definicao.nos.length).padStart(2, "0")}</strong>
          <small>{definicao.conexoes.length} conexões configuradas</small>
        </div>
        <div className="stat-card">
          <span className="stat-icon green">✓</span>
          <span className="stat-label">Validação</span>
          <strong className="stat-word">{valida ? "Pronto" : "Pendente"}</strong>
          <small>{valida ? "Definição local válida" : "Ajuste os erros no estúdio"}</small>
        </div>
      </div>

      <div className="content-grid">
        <section className="surface-panel draft-panel">
          <div className="panel-heading">
            <div>
              <h3>Continue de onde parou</h3>
              <p>Seu fluxo mais recente está disponível no estúdio.</p>
            </div>
            <span className="outline-tag">Em edição</span>
          </div>
          <div className="draft-row">
            <span className="draft-icon">✳</span>
            <div>
              <strong>{definicao.nome}</strong>
              <small>
                {definicao.nos.length} etapas · {definicao.variaveis.length} variáveis
              </small>
            </div>
            <Link className="icon-link" aria-label="Abrir fluxo" to="/studio">
              ↗
            </Link>
          </div>
          <div className="panel-footer">
            O rascunho é guardado somente neste navegador. Exporte o JSON para ter uma cópia.
          </div>
        </section>

        <section className="surface-panel roadmap-panel">
          <div className="panel-heading">
            <div>
              <h3>Próximas integrações</h3>
              <p>O que conectará o editor ao produto completo.</p>
            </div>
          </div>
          <div className="roadmap-item">
            <span>01</span>
            <div>
              <strong>Conta e persistência</strong>
              <small>Autenticação, bots e versões na API</small>
            </div>
          </div>
          <div className="roadmap-item">
            <span>02</span>
            <div>
              <strong>Conversa em tempo real</strong>
              <small>Motor, contexto e chat web</small>
            </div>
          </div>
          <div className="roadmap-item">
            <span>03</span>
            <div>
              <strong>Catálogo e assinatura</strong>
              <small>Aquisição e pagamento em sandbox</small>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
