import { createAuthClient } from "better-auth/react";
import { create } from "zustand";
import { useIntegracoesStore } from "./integracoes";

export const baseURL = import.meta.env.VITE_API_URL || window.location.origin;
export const authClient = createAuthClient({
  baseURL,
  fetchOptions: { credentials: "include" },
});

export type Usuario = {
  id: string;
  contaId: string;
  nome: string;
  email: string;
  empresa: string;
};

type SessaoState = {
  usuario: Usuario | null;
  carregando: boolean;
  inicializar: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  criar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

async function buscarUsuario(): Promise<Usuario | null> {
  const resposta = await fetch(`${baseURL}/api/me`, { credentials: "include" });
  if (resposta.status === 401) return null;
  if (!resposta.ok) throw new Error("Não foi possível carregar sua conta.");
  const dados = await resposta.json() as {
    usuario: { id: string; nome: string; email: string };
    conta: { id: string; nome: string };
  };
  return {
    id: dados.usuario.id,
    contaId: dados.conta.id,
    nome: dados.usuario.nome,
    email: dados.usuario.email,
    empresa: dados.conta.nome,
  };
}

async function limparDadosDaSessaoAnterior() {
  try {
    localStorage.removeItem("syncra.sessao.demo.v1");
    localStorage.removeItem("syncra.studio.rascunho.v1");
    localStorage.removeItem("syncra.marketplace.adquiridos.v1");
  } catch { /* O navegador pode bloquear armazenamento local. */ }
  const [{ useBotsStore }, { useStudioStore }] = await Promise.all([
    import("./bots"), import("./studio"),
  ]);
  useBotsStore.getState().limpar();
  useStudioStore.getState().restaurarExemplo();
  useIntegracoesStore.getState().desconectarWhatsApp();
}

export const useSessaoStore = create<SessaoState>((set) => ({
  usuario: null,
  carregando: true,
  inicializar: async () => {
    try { set({ usuario: await buscarUsuario() }); }
    finally { set({ carregando: false }); }
  },
  entrar: async (email, senha) => {
    const { error } = await authClient.signIn.email({ email, password: senha });
    if (error) throw new Error(error.message || "E-mail ou senha inválidos.");
    await limparDadosDaSessaoAnterior();
    set({ usuario: await buscarUsuario(), carregando: false });
  },
  criar: async (nome, email, senha) => {
    const { error } = await authClient.signUp.email({ name: nome, email, password: senha });
    if (error) throw new Error(error.message || "Não foi possível criar a conta.");
    await limparDadosDaSessaoAnterior();
    set({ usuario: await buscarUsuario(), carregando: false });
  },
  sair: async () => {
    await authClient.signOut();
    await limparDadosDaSessaoAnterior();
    set({ usuario: null });
  },
}));

export function iniciais(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase()).join("") || "S";
}
