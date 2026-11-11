import { validarDefinicao, type DefinicaoBot } from "@syncra/shared";
import { create } from "zustand";
import { baseURL } from "./sessao";
import { useStudioStore } from "./studio";

export type BotResumo = { id: string; nome: string; criadoEm: string };

type BotsState = {
  lista: BotResumo[];
  ativoId: string | null;
  versao: number | null;
  ultimaSalva: string | null;
  carregando: boolean;
  carregarLista: () => Promise<void>;
  abrir: (id: string) => Promise<void>;
  novo: () => void;
  salvar: () => Promise<number>;
  restaurar: (id: string, numero: number) => Promise<number>;
  limpar: () => void;
};

export async function obterJSON<T>(rota: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${baseURL}${rota}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!resposta.ok) {
    if (resposta.status === 401) throw new Error("Sua sessão expirou. Entre novamente.");
    if (resposta.status === 404) throw new Error("Bot não encontrado nesta conta.");
    const dados = await resposta.json().catch(() => null) as { erros?: { mensagem: string }[] } | null;
    throw new Error(dados?.erros?.[0]?.mensagem || "Não foi possível concluir a operação.");
  }
  return resposta.json() as Promise<T>;
}

export const useBotsStore = create<BotsState>((set, get) => ({
  lista: [],
  ativoId: null,
  versao: null,
  ultimaSalva: null,
  carregando: false,
  carregarLista: async () => {
    const dados = await obterJSON<{ bots: BotResumo[] }>("/api/bots");
    set({ lista: dados.bots });
  },
  abrir: async (id) => {
    set({ carregando: true });
    try {
      const bot = await obterJSON<{ id: string; versao: number; definicao: DefinicaoBot }>(`/api/bots/${id}`);
      useStudioStore.getState().carregarDefinicao(bot.definicao);
      set({ ativoId: bot.id, versao: bot.versao, ultimaSalva: JSON.stringify(useStudioStore.getState().definicao) });
    } finally { set({ carregando: false }); }
  },
  novo: () => {
    useStudioStore.getState().restaurarExemplo();
    set({ ativoId: null, versao: null, ultimaSalva: null });
  },
  salvar: async () => {
    const definicao = useStudioStore.getState().definicao;
    const validacao = validarDefinicao(definicao);
    if (!validacao.ok) throw new Error(validacao.erros[0]?.mensagem || "Fluxo inválido.");
    set({ carregando: true });
    try {
      const id = get().ativoId;
      const salvo = await obterJSON<{ id: string; versao: number }>(
        id ? `/api/bots/${id}` : "/api/bots",
        { method: id ? "PUT" : "POST", body: JSON.stringify(validacao.definicao) },
      );
      set({ ativoId: salvo.id, versao: salvo.versao, ultimaSalva: JSON.stringify(definicao) });
      await get().carregarLista();
      return salvo.versao;
    } finally { set({ carregando: false }); }
  },
  restaurar: async (id, numero) => {
    set({ carregando: true });
    try {
      const salvo = await obterJSON<{ versao: number }>(`/api/bots/${id}/versoes/${numero}/restaurar`, { method: "POST" });
      await get().abrir(id);
      await get().carregarLista();
      return salvo.versao;
    } finally { set({ carregando: false }); }
  },
  limpar: () => set({ lista: [], ativoId: null, versao: null, ultimaSalva: null }),
}));
