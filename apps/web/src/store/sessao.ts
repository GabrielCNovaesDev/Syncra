import { create } from "zustand";

/**
 * Sessão de demonstração. Não há autenticação real aqui (E2 ainda não foi
 * entregue): qualquer e-mail entra e nada é enviado para fora do navegador.
 */
export type UsuarioDemo = {
  nome: string;
  email: string;
  empresa: string;
};

const CHAVE_SESSAO = "syncra.sessao.demo.v1";

function carregar(): UsuarioDemo | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    return bruto ? (JSON.parse(bruto) as UsuarioDemo) : null;
  } catch {
    return null;
  }
}

function nomeAPartirDoEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const partes = local.split(/[._-]+/).filter(Boolean);
  if (partes.length === 0) return "Visitante";
  return partes
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

type SessaoState = {
  usuario: UsuarioDemo | null;
  entrar: (email: string, nome?: string) => void;
  sair: () => void;
};

export const useSessaoStore = create<SessaoState>((set) => ({
  usuario: carregar(),
  entrar: (email, nome) => {
    const emailLimpo = email.trim() || "visitante@syncra.bot";
    const usuario: UsuarioDemo = {
      email: emailLimpo,
      nome: nome?.trim() || nomeAPartirDoEmail(emailLimpo),
      empresa: "Workspace de demonstração",
    };
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    } catch {
      // segue apenas em memória.
    }
    set({ usuario });
  },
  sair: () => {
    try {
      localStorage.removeItem(CHAVE_SESSAO);
    } catch {
      // nada a limpar.
    }
    set({ usuario: null });
  },
}));

export function iniciais(nome: string): string {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "S"
  );
}
