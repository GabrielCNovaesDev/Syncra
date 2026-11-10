import { useEffect, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon, WhatsAppGlyph, type NomeIcone } from "../components/Icon";
import { ITENS_MARKETPLACE, carregarAdquiridos, formatarPreco } from "../data/marketplace";
import { useIntegracoesStore } from "../store/integracoes";
import { useSessaoStore } from "../store/sessao";
import { useStudioStore } from "../store/studio";
import { useBotsStore } from "../store/bots";
import { toast } from "../store/toast";

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function PainelPage() {
  const valida = useStudioStore((s) => s.valida);
  const bots = useBotsStore((s) => s.lista);
  const ativoId = useBotsStore((s) => s.ativoId);
  const carregarLista = useBotsStore((s) => s.carregarLista);
  const usuario = useSessaoStore((s) => s.usuario);
  const whatsapp = useIntegracoesStore((s) => s.whatsapp);
  const adquiridos = carregarAdquiridos();
  const sugestoes = ITENS_MARKETPLACE.filter((i) => !adquiridos.includes(i.id)).slice(0, 3);

  useEffect(() => {
    void carregarLista().catch((erro) => toast.erro("Não foi possível carregar seus bots", String(erro)));
  }, [carregarLista]);

  const passos: { feito: boolean; titulo: string; para: string; icone: NomeIcone }[] = [
    { feito: bots.length > 0, titulo: "Salve seu primeiro fluxo", para: "/app/studio?novo=1", icone: "workflow" },
    { feito: Boolean(ativoId) && valida, titulo: "Deixe o fluxo sem pendências", para: "/app/studio", icone: "shield" },
    { feito: adquiridos.length > 0, titulo: "Explore um modelo do marketplace", para: "/app/marketplace", icone: "store" },
    { feito: Boolean(whatsapp), titulo: "Conecte o WhatsApp", para: "/app/integracoes", icone: "plug" },
  ];
  const progresso = passos.filter((p) => p.feito).length;

  return (
    <div className="page overview-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEU WORKSPACE</div>
          <h1>
            {saudacao()}, {usuario?.nome.split(" ")[0]}
            <span className="heading-dot">.</span>
          </h1>
          <p>Um lugar para desenhar conversas que fazem sentido.</p>
        </div>
        <Link className="button button-primary" to="/app/studio?novo=1">
          <Icon name="plus" size={15} /> Criar bot
        </Link>
      </div>

      <section className="hero-panel">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-copy">
          <span className="hero-kicker">
            <Icon name="sparkles" size={12} /> PRIMEIROS PASSOS · {progresso}/{passos.length}
          </span>
          <h2>
            Boas conversas
            <br />
            começam com um <em>bom fluxo.</em>
          </h2>
          <div className="progress-bar" aria-label={`Progresso ${progresso} de ${passos.length}`}>
            <span style={{ width: `${(progresso / passos.length) * 100}%` }} />
          </div>
          <ul className="onboarding-list">
            {passos.map((p) => (
              <li key={p.titulo} className={p.feito ? "done" : ""}>
                <Link to={p.para}>
                  <span className="onboarding-check">
                    {p.feito ? <Icon name="check" size={11} strokeWidth={3} /> : <Icon name={p.icone} size={12} />}
                  </span>
                  {p.titulo}
                  {!p.feito ? <Icon name="arrowRight" size={12} className="onboarding-go" /> : null}
                </Link>
              </li>
            ))}
          </ul>
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

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon purple">
            <Icon name="workflow" size={17} />
          </span>
          <span className="stat-label">Bots salvos</span>
          <strong>{String(bots.length).padStart(2, "0")}</strong>
          <small>Guardados na sua conta</small>
        </div>
        <div className="stat-card">
          <span className={ativoId && valida ? "stat-icon green" : "stat-icon red"}>
            <Icon name={ativoId && valida ? "checkCircle" : "alert"} size={17} />
          </span>
          <span className="stat-label">Validação</span>
          <strong className="stat-word">{ativoId && valida ? "Pronto" : "Pendente"}</strong>
          <small>{ativoId && valida ? "Regras V-01 a V-08 atendidas" : "Crie e salve um fluxo válido"}</small>
        </div>
        <Link to="/app/integracoes" className="stat-card stat-link">
          <span className={whatsapp ? "stat-icon whatsapp" : "stat-icon blue"}>
            <WhatsAppGlyph size={17} />
          </span>
          <span className="stat-label">WhatsApp</span>
          <strong className="stat-word">{whatsapp ? "Conectado" : "Desconectado"}</strong>
          <small>{whatsapp ? `${whatsapp.numero} · ${whatsapp.botAtivo ? "respondendo" : "pausado"}` : "Conecte um número em 4 passos"}</small>
        </Link>
      </div>

      <div className="content-grid">
        <section className="surface-panel draft-panel">
          <div className="panel-heading">
            <div>
              <h3>Seus bots</h3>
              <p>Abra um fluxo salvo para continuar editando.</p>
            </div>
            <span className="outline-tag">{bots.length} salvos</span>
          </div>
          {bots.length === 0 ? <p>Nenhum bot salvo ainda.</p> : bots.map((bot) => (
            <Link className="draft-row" to={`/app/studio?bot=${bot.id}`} key={bot.id}>
              <span className="draft-icon"><Icon name="bot" size={22} /></span>
              <div><strong>{bot.nome}</strong><small>Abra para editar e salvar uma nova versão</small></div>
              <span className="icon-link" aria-hidden="true"><Icon name="arrowUpRight" size={15} /></span>
            </Link>
          ))}
          <div className="panel-footer">
            Cada salvamento cria uma versão imutável no servidor.
          </div>
        </section>

        <section className="surface-panel">
          <div className="panel-heading">
            <div>
              <h3>Sugestões do marketplace</h3>
              <p>Modelos prontos para acelerar.</p>
            </div>
            <Link to="/app/marketplace" className="outline-tag">
              Ver todos
            </Link>
          </div>
          <div className="suggestion-list">
            {sugestoes.map((item) => (
              <Link
                key={item.id}
                to="/app/marketplace"
                className="suggestion-row"
                style={{ "--item-color": item.cor } as CSSProperties}
              >
                <span className="item-icon">
                  <Icon name={item.icone} size={16} />
                </span>
                <div>
                  <strong>{item.nome}</strong>
                  <small>{item.categoria}</small>
                </div>
                <span className="price-tag">{formatarPreco(item.precoMensal)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
