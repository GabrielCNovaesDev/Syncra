import { create } from "zustand";

/**
 * Estado da integração WhatsApp SIMULADA. Em produção, o token de acesso da
 * Meta vai para o backend e é guardado cifrado; aqui ele nunca é persistido —
 * guardamos apenas os 4 últimos caracteres para exibição.
 */
export type ConexaoWhatsApp = {
  numero: string;
  nomeExibicao: string;
  empresa: string;
  wabaId: string;
  phoneNumberId: string;
  tokenFinal: string;
  verifyToken: string;
  botVinculado: string;
  botAtivo: boolean;
  conectadoEm: string;
};

const CHAVE = "syncra.integracoes.whatsapp.v1";

function carregar(): ConexaoWhatsApp | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as ConexaoWhatsApp) : null;
  } catch {
    return null;
  }
}

function salvar(conexao: ConexaoWhatsApp | null) {
  try {
    if (conexao) localStorage.setItem(CHAVE, JSON.stringify(conexao));
    else localStorage.removeItem(CHAVE);
  } catch {
    // apenas em memória.
  }
}

type IntegracoesState = {
  whatsapp: ConexaoWhatsApp | null;
  conectarWhatsApp: (conexao: ConexaoWhatsApp) => void;
  atualizarWhatsApp: (alteracoes: Partial<ConexaoWhatsApp>) => void;
  desconectarWhatsApp: () => void;
};

export const useIntegracoesStore = create<IntegracoesState>((set, get) => ({
  whatsapp: carregar(),
  conectarWhatsApp: (conexao) => {
    salvar(conexao);
    set({ whatsapp: conexao });
  },
  atualizarWhatsApp: (alteracoes) => {
    const atual = get().whatsapp;
    if (!atual) return;
    const whatsapp = { ...atual, ...alteracoes };
    salvar(whatsapp);
    set({ whatsapp });
  },
  desconectarWhatsApp: () => {
    salvar(null);
    set({ whatsapp: null });
  },
}));

export function gerarIdNumerico(digitos: number): string {
  let id = String(1 + Math.floor(Math.random() * 9));
  while (id.length < digitos) id += String(Math.floor(Math.random() * 10));
  return id;
}

export function gerarVerifyToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `syncra_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
