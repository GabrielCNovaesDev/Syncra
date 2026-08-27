import { definicaoExemploValida, type DefinicaoBot, type TipoNo, validarDefinicao } from "@syncra/shared";
import { create } from "zustand";

type StudioState = {
  definicao: DefinicaoBot;
  erros: string[];
  valida: boolean;
  setDefinicao: (definicao: DefinicaoBot) => void;
  validarLocal: () => void;
};

const cores: Record<TipoNo, string> = {
  mensagem: "#3b82f6",
  pergunta: "#8b5cf6",
  ia: "#f59e0b",
  condicao: "#10b981",
  encerramento: "#64748b",
};

export { cores };

export const useStudioStore = create<StudioState>((set, get) => ({
  definicao: definicaoExemploValida(),
  erros: [],
  valida: true,
  setDefinicao: (definicao) => set({ definicao }),
  validarLocal: () => {
    const r = validarDefinicao(get().definicao);
    if (r.ok) {
      set({ valida: true, erros: [] });
      return;
    }
    set({
      valida: false,
      erros: r.erros.map((e) => `${e.regra}: ${e.mensagem}`),
    });
  },
}));
