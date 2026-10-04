import { NavLink, Route, Routes } from "react-router-dom";
import { CatalogoPage } from "./pages/CatalogoPage";
import { PainelPage } from "./pages/PainelPage";
import { StudioPage } from "./pages/StudioPage";

function itemAtivo({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-item active" : "nav-item";
}

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" end aria-label="Syncra Bot, ir para visão geral" className="brand">
          <span className="brand-mark">✳</span>
          <span>
            syncra bot<span className="brand-dot">.</span>
          </span>
        </NavLink>

        <div className="workspace-switch">
          <span className="workspace-avatar">S</span>
          <span>
            <strong>Workspace</strong>
            <small>Ambiente local</small>
          </span>
          <span className="workspace-chevron">⌄</span>
        </div>

        <div className="sidebar-label">PLATAFORMA</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <NavLink to="/" end className={itemAtivo}>
            <span className="nav-icon">▦</span>Visão geral
          </NavLink>
          <NavLink to="/studio" className={itemAtivo}>
            <span className="nav-icon">◇</span>Estúdio
          </NavLink>
          <NavLink to="/catalogo" className={itemAtivo}>
            <span className="nav-icon">▤</span>Catálogo
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-notice">
            <span className="notice-spark">✦</span>
            <strong>Do fluxo à conversa</strong>
            <p>Desenhe a jornada do seu chatbot no estúdio visual.</p>
          </div>
          <div className="sidebar-profile">
            <span className="profile-avatar">S</span>
            <span>
              <strong>Syncra Bot local</strong>
              <small>Prévia de desenvolvimento</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span> Syncra Bot
          </span>
          <span className="topbar-status">
            <i /> Ambiente de desenvolvimento
          </span>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<PainelPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
