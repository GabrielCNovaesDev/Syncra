import { NavLink, Route, Routes } from "react-router-dom";
import { CatalogoPage } from "./pages/CatalogoPage";
import { PainelPage } from "./pages/PainelPage";
import { StudioPage } from "./pages/StudioPage";

export function App() {
  return (
    <div className="shell">
      <header className="topbar">
        <strong>Syncra Bot</strong>
        <nav>
          <NavLink to="/">Painel</NavLink>
          <NavLink to="/studio">Estúdio</NavLink>
          <NavLink to="/catalogo">Catálogo</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<PainelPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
        </Routes>
      </main>
    </div>
  );
}
