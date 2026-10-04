import { Link } from "react-router-dom";

export function CatalogoPage() {
  return (
    <div className="page catalog-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DESCUBRA POSSIBILIDADES</div>
          <h1>
            Catálogo Syncra Bot<span className="heading-dot">.</span>
          </h1>
          <p>Modelos prontos para acelerar a criação dos seus assistentes.</p>
        </div>
        <span className="section-tag">EM PREPARAÇÃO</span>
      </div>

      <section className="catalog-hero">
        <div className="catalog-copy">
          <span className="hero-kicker">✦ EM BREVE</span>
          <h2>
            Um ponto de partida
            <br />
            para cada ideia<span className="heading-dot">.</span>
          </h2>
          <p>
            O catálogo reunirá bots criados pela Syncra Bot. Você poderá adquirir uma cópia para
            sua conta e adaptá-la no estúdio.
          </p>
          <Link className="button button-primary" to="/studio">
            Criar meu próprio fluxo <span>↗</span>
          </Link>
        </div>
        <div className="catalog-illustration">
          <div className="catalog-visual-card card-back">✳</div>
          <div className="catalog-visual-card card-front">
            <span>✦</span>
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <div className="section-title">
        <div>
          <h2>Como vai funcionar</h2>
          <p>Da inspiração à primeira conversa.</p>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-top">
            <span>◇</span>
            <small>01</small>
          </div>
          <h3>Crie uma jornada</h3>
          <p>Organize mensagens, perguntas e condições em um mapa visual.</p>
        </div>
        <div className="feature-card">
          <div className="feature-top">
            <span>✦</span>
            <small>02</small>
          </div>
          <h3>Personalize respostas</h3>
          <p>Combine instruções próprias com etapas de resposta por IA.</p>
        </div>
        <div className="feature-card">
          <div className="feature-top">
            <span>↗</span>
            <small>03</small>
          </div>
          <h3>Compartilhe em breve</h3>
          <p>A vitrine e aquisição chegam após contas, versões e conversa.</p>
        </div>
      </div>

      <div className="catalog-note">
        <span>ⓘ</span> A busca, aquisição e assinatura ainda não estão disponíveis neste ambiente
        local. Nenhum item de catálogo é exibido como se já pudesse ser comprado.
      </div>
    </div>
  );
}
