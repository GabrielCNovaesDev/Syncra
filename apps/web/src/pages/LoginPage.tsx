import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { useSessaoStore } from "../store/sessao";

export function LoginPage() {
  const usuario = useSessaoStore((s) => s.usuario);
  const entrar = useSessaoStore((s) => s.entrar);
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? "/app";

  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (usuario && !carregando) return <Navigate to={destino} replace />;

  function concluir(emailUsado: string) {
    setCarregando(true);
    window.setTimeout(() => {
      entrar(emailUsado, modo === "criar" ? nome : undefined);
      navigate(destino, { replace: true });
    }, 850);
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    concluir(email);
  }

  return (
    <div className="login-page">
      <div className="login-form-side">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={18} strokeWidth={2.4} />
          </span>
          <span>
            syncra bot<span className="brand-dot">.</span>
          </span>
        </Link>

        <div className="login-card page-enter">
          <h1>{modo === "entrar" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
          <p className="muted">
            {modo === "entrar"
              ? "Entre para continuar construindo seus bots."
              : "Leva menos de um minuto. Sem cartão de crédito."}
          </p>

          <div className="demo-notice">
            <Icon name="info" size={14} />
            <span>
              <strong>Modo demonstração:</strong> qualquer e-mail e senha funcionam. Nada é enviado a
              um servidor.
            </span>
          </div>

          <button
            type="button"
            className="button button-social block"
            disabled={carregando}
            onClick={() => concluir("visitante@syncra.bot")}
          >
            <Icon name="zap" size={15} /> Entrar como visitante
          </button>

          <div className="divider">
            <span>ou com e-mail</span>
          </div>

          <form onSubmit={aoEnviar} className="login-fields">
            {modo === "criar" ? (
              <label className="field">
                Seu nome
                <input
                  value={nome}
                  autoComplete="name"
                  placeholder="Como devemos te chamar?"
                  onChange={(e) => setNome(e.target.value)}
                />
              </label>
            ) : null}
            <label className="field">
              E-mail
              <div className="input-icon">
                <Icon name="mail" size={15} />
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <label className="field">
              <span className="field-label-row">
                Senha
                {modo === "entrar" ? <a href="#" onClick={(e) => e.preventDefault()}>Esqueceu?</a> : null}
              </span>
              <div className="input-icon">
                <Icon name="lock" size={15} />
                <input
                  type="password"
                  value={senha}
                  autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
            </label>
            <button type="submit" className="button button-primary block button-lg" disabled={carregando}>
              {carregando ? (
                <>
                  <span className="spinner small" /> Entrando…
                </>
              ) : (
                <>
                  {modo === "entrar" ? "Entrar" : "Criar conta"} <Icon name="arrowRight" size={15} />
                </>
              )}
            </button>
          </form>

          <p className="login-switch">
            {modo === "entrar" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button type="button" onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}>
              {modo === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </div>

      <div className="login-visual-side" aria-hidden="true">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <div className="login-visual">
          <div className="lv-card lv-1">
            <span style={{ background: "#59a9ff26", color: "#59a9ff" }}>
              <Icon name="message" size={14} />
            </span>
            Olá! Como posso ajudar?
          </div>
          <div className="lv-card lv-2">
            <span style={{ background: "#a589ff26", color: "#a589ff" }}>
              <Icon name="help" size={14} />
            </span>
            Qual o seu nome?
          </div>
          <div className="lv-card lv-3">
            <span style={{ background: "#f6b96326", color: "#f6b963" }}>
              <Icon name="sparkles" size={14} />
            </span>
            Resposta personalizada com IA
          </div>
          <div className="lv-stat">
            <Icon name="chart" size={16} />
            <div>
              <strong>+38%</strong>
              <small>conversões com atendimento 24/7</small>
            </div>
          </div>
        </div>
        <blockquote>
          “Montamos o atendimento da clínica em uma tarde. Hoje o bot agenda metade das consultas.”
          <cite>Dra. Helena M. · Clínica Vida (depoimento ilustrativo)</cite>
        </blockquote>
      </div>
    </div>
  );
}
