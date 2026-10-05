import { create } from "zustand";

export type TomToast = "sucesso" | "info" | "erro";

export type Toast = { id: number; tom: TomToast; titulo: string; descricao?: string };

type ToastState = {
  toasts: Toast[];
  mostrar: (toast: Omit<Toast, "id">) => void;
  remover: (id: number) => void;
};

let proximoId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  mostrar: (toast) => {
    proximoId += 1;
    const id = proximoId;
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-4) });
    window.setTimeout(() => get().remover(id), 4200);
  },
  remover: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  sucesso: (titulo: string, descricao?: string) =>
    useToastStore.getState().mostrar({ tom: "sucesso", titulo, descricao }),
  info: (titulo: string, descricao?: string) =>
    useToastStore.getState().mostrar({ tom: "info", titulo, descricao }),
  erro: (titulo: string, descricao?: string) =>
    useToastStore.getState().mostrar({ tom: "erro", titulo, descricao }),
};
