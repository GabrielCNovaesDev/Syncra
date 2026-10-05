import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Icon, type NomeIcone } from "./components/Icon";
import { Toaster } from "./components/Toaster";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { useIntegracoesStore } from "./store/integracoes";
import { iniciais, useSessaoStore } from "./store/sessao";

// Páginas do app carregadas sob demanda: a landing não precisa do React Flow.
const PainelPage = lazy(() => import("./pages/PainelPage").then((m) => ({ default: m.PainelPage })));
const StudioPage = lazy(() => import("./pages/StudioPage").then((m) => ({ default: m.StudioPage })));
const MarketplacePage = lazy(() =>
  import("./pages/MarketplacePage").then((m) => ({ default: m.MarketplacePage })),
);
const IntegracoesPage = lazy(() =>
  import("./pages/IntegracoesPage").then((m) => ({ default: m.IntegracoesPage })),
);

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/app" element={<RotaProtegida />}>
          <Route index element={<PainelPage />} />
          <Route path="studio" element={<StudioPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="integracoes" element={<IntegracoesPage />} />
        </Route>
        <Route path="/studio" element={<Navigate to="/app/studio" replace />} />
        <Route path="/catalogo" element={<Navigate to="/app/marketplace" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

function RotaProtegida() {
  const usuario = useSessaoStore((s) => s.usuario);
  const location = useLocation();
  if (!usuario) return <Navigate to="/entrar" replace state={{ de: location.pathname }} />;
  return <AppShell />;
}

function itemAtivo({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-item active" : "nav-item";
}

const NAVEGACAO: { para: string; rotulo: string; icone: NomeIcone; fim?: boolean }[] = [
  { para: "/app", rotulo: "Visão geral", icone: "layout", fim: true },
  { para: "/app/studio", rotulo: "Estúdio", icone: "workflow" },
  { para: "/app/marketplace", rotulo: "Marketplace", icone: "store" },
  { para: "/app/integracoes", rotulo: "Integrações", icone: "plug" },
];

const TITULOS: Record<string, string> = {
  "/app": "Visão geral",
  "/app/studio": "Estúdio",
  "/app/marketplace": "Marketplace",
  "/app/integracoes": "Integrações",
};

function AppShell() {
  const usuario = useSessaoStore((s) => s.usuario)!;
  const sair = useSessaoStore((s) => s.sair);
  const whatsapp = useIntegracoesStore((s) => s.whatsapp);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  function aoSair() {
    sair();
    navigate("/", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/app" end aria-label="Syncra Bot, ir para visão geral" className="brand">
          <span className="brand-mark">
            <Icon name="logo" size={18} strokeWidth={2.4} />
          </span>
          <span>
            syncra bot<span className="brand-dot">.</span>
          </span>
        </NavLink>

        <div className="workspace-switch">
          <span className="workspace-avatar">{iniciais(usuario.nome)}</span>
          <span>
            <strong>{usuario.empresa}</strong>
            <small>Plano demonstração</small>
          </span>
          <Icon name="chevronDown" size={14} className="workspace-chevron" />
        </div>

        <div className="sidebar-label">PLATAFORMA</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {NAVEGACAO.map((item) => (
            <NavLink key={item.para} to={item.para} end={item.fim} className={itemAtivo}>
              <span className="nav-icon">
                <Icon name={item.icone} size={18} />
              </span>
              {item.rotulo}
              {item.para === "/app/integracoes" && whatsapp ? <i className="nav-dot" /> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-notice">
            <span className="notice-spark">
              <Icon name="sparkles" size={18} />
            </span>
            <strong>Do fluxo à conversa</strong>
            <p>Teste seu bot no estúdio e conecte ao WhatsApp em minutos.</p>
          </div>
          <div className="sidebar-profile" ref={menuRef}>
            <button type="button" className="profile-button" onClick={() => setMenuAberto((v) => !v)}>
              <span className="profile-avatar">{iniciais(usuario.nome)}</span>
              <span>
                <strong>{usuario.nome}</strong>
                <small>{usuario.email}</small>
              </span>
            </button>
            {menuAberto ? (
              <div className="profile-menu">
                <button type="button" onClick={aoSair}>
                  <Icon name="logout" size={14} /> Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <span className="breadcrumb">
            {usuario.empresa} <span>/</span> {TITULOS[location.pathname] ?? "Syncra Bot"}
          </span>
          <div className="topbar-right">
            <span className="topbar-status">
              <i /> Modo demonstração
            </span>
            <button type="button" className="topbar-logout" onClick={aoSair} aria-label="Sair">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </header>
        <main key={location.pathname}>
          <Suspense fallback={<div className="route-loading"><span className="spinner" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
