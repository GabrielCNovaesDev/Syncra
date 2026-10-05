import {
  definicaoExemploValida,
  validarDefinicao,
  type ConexaoBot,
  type DefinicaoBot,
  type ErroValidacao,
  type NoBot,
  type TipoNo,
  type VariavelBot,
} from "@syncra/shared";
import { create } from "zustand";
import type { NomeIcone } from "../components/Icon";
import { comPosicoesCompletas, layoutEmCamadas } from "../lib/layout";

export const cores: Record<TipoNo, string> = {
  mensagem: "#59a9ff",
  pergunta: "#a589ff",
  ia: "#f6b963",
  condicao: "#58d6b5",
  encerramento: "#f18c9a",
};

export const icones: Record<TipoNo, NomeIcone> = {
  mensagem: "message",
  pergunta: "help",
  ia: "sparkles",
  condicao: "split",
  encerramento: "flag",
};

export const descricoes: Record<TipoNo, string> = {
  mensagem: "Envia um texto fixo",
  pergunta: "Coleta uma resposta",
  ia: "Gera resposta com IA",
  condicao: "Divide o caminho",
  encerramento: "Finaliza a conversa",
};

export const rotulos: Record<TipoNo, string> = {
  mensagem: "Mensagem",
  pergunta: "Pergunta",
  ia: "Resposta com IA",
  condicao: "Condição",
  encerramento: "Encerramento",
};

export const ORDEM_PALETA: TipoNo[] = ["mensagem", "pergunta", "ia", "condicao", "encerramento"];

export function textoPreview(no: NoBot): string {
  switch (no.tipo) {
    case "mensagem":
      return no.texto;
    case "pergunta":
      return no.texto;
    case "condicao":
      return no.expressao;
    case "ia":
      return no.instrucao;
    case "encerramento":
      return no.texto_final;
  }
}

const CHAVE_RASCUNHO = "syncra.studio.rascunho.v1";

function persistir(definicao: DefinicaoBot) {
  try {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(definicao));
  } catch {
    // ambiente sem localStorage disponível; segue apenas em memória.
  }
}

function carregarInicial(): DefinicaoBot {
  try {
    const bruto = localStorage.getItem(CHAVE_RASCUNHO);
    if (!bruto) return comPosicoesCompletas(definicaoExemploValida());
    const resultado = validarDefinicao(JSON.parse(bruto));
    return comPosicoesCompletas(resultado.ok ? resultado.definicao : definicaoExemploValida());
  } catch {
    return comPosicoesCompletas(definicaoExemploValida());
  }
}

function gerarId(tipo: TipoNo, nos: NoBot[]): string {
  const existentes = new Set(nos.map((no) => no.id));
  let sequencia = nos.length + 1;
  while (existentes.has(`no_${tipo}_${sequencia}`)) sequencia += 1;
  return `no_${tipo}_${sequencia}`;
}

function criarNo(tipo: TipoNo, id: string, variaveis: VariavelBot[]): NoBot {
  const primeiraVariavel = variaveis[0]?.chave ?? "variavel";
  switch (tipo) {
    case "mensagem":
      return { id, tipo, texto: "Nova mensagem." };
    case "pergunta":
      return { id, tipo, texto: "Nova pergunta?", variavel_destino: primeiraVariavel };
    case "ia":
      return {
        id,
        tipo,
        instrucao: "Nova instrução para a IA.",
        modelo: "modelo-rapido",
        usar_historico: false,
      };
    case "condicao":
      return { id, tipo, expressao: primeiraVariavel };
    case "encerramento":
      return { id, tipo, texto_final: "Até logo." };
  }
}

export type Selecao = { tipo: "no"; id: string } | { tipo: "conexao"; index: number } | null;

export type AbaInspector = "propriedades" | "fluxo";

type StudioState = {
  definicao: DefinicaoBot;
  valida: boolean;
  erros: ErroValidacao[];
  selecao: Selecao;
  aba: AbaInspector;
  erroImportacao: string | null;

  selecionarNo: (id: string) => void;
  selecionarConexao: (index: number) => void;
  limparSelecao: () => void;
  setAba: (aba: AbaInspector) => void;
  dispensarErroImportacao: () => void;

  adicionarNo: (tipo: TipoNo, posicao?: { x: number; y: number }) => void;
  atualizarNo: (id: string, atualizar: (no: NoBot) => NoBot) => void;
  moverNo: (id: string, posicao: { x: number; y: number }) => void;
  excluirNo: (id: string) => void;
  definirNoInicial: (id: string) => void;

  conectar: (de: string, para: string) => void;
  atualizarCondicaoConexao: (index: number, condicao: string | null) => void;
  excluirConexao: (index: number) => void;

  atualizarMeta: (
    alteracoes: Partial<Pick<DefinicaoBot, "nome" | "modelo_padrao" | "instrucao_global">>,
  ) => void;
  adicionarVariavel: () => void;
  atualizarVariavel: (index: number, alteracoes: Partial<VariavelBot>) => void;
  excluirVariavel: (index: number) => void;

  exportarJSON: () => string;
  importarJSON: (texto: string) => void;
  restaurarExemplo: () => void;
  carregarDefinicao: (definicao: DefinicaoBot) => void;
  organizarLayout: () => void;
};

function revalidar(definicao: DefinicaoBot) {
  const resultado = validarDefinicao(definicao);
  return resultado.ok
    ? { valida: true, erros: [] as ErroValidacao[] }
    : { valida: false, erros: resultado.erros };
}

const definicaoInicial = carregarInicial();

export const useStudioStore = create<StudioState>((set, get) => ({
  definicao: definicaoInicial,
  ...revalidar(definicaoInicial),
  selecao: null,
  aba: "propriedades",
  erroImportacao: null,

  selecionarNo: (id) => set({ selecao: { tipo: "no", id }, aba: "propriedades" }),
  selecionarConexao: (index) => set({ selecao: { tipo: "conexao", index }, aba: "propriedades" }),
  limparSelecao: () => set({ selecao: null }),
  setAba: (aba) => set({ aba }),
  dispensarErroImportacao: () => set({ erroImportacao: null }),

  adicionarNo: (tipo, posicao) => {
    const definicaoAtual = get().definicao;
    const id = gerarId(tipo, definicaoAtual.nos);
    const novoNo = criarNo(tipo, id, definicaoAtual.variaveis);
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      nos: [...definicaoAtual.nos, novoNo],
      no_inicial: definicaoAtual.nos.length === 0 ? id : definicaoAtual.no_inicial,
      metadados_editor: {
        posicoes: {
          ...definicaoAtual.metadados_editor?.posicoes,
          [id]: posicao ?? {
            x: 120 + (definicaoAtual.nos.length % 3) * 240,
            y: 80 + Math.floor(definicaoAtual.nos.length / 3) * 180,
          },
        },
      },
    };
    set({ definicao, selecao: { tipo: "no", id }, aba: "propriedades", ...revalidar(definicao) });
    persistir(definicao);
  },

  atualizarNo: (id, atualizar) => {
    const definicaoAtual = get().definicao;
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      nos: definicaoAtual.nos.map((no) => (no.id === id ? atualizar(no) : no)),
    };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  moverNo: (id, posicao) => {
    const definicaoAtual = get().definicao;
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      metadados_editor: {
        posicoes: { ...definicaoAtual.metadados_editor?.posicoes, [id]: posicao },
      },
    };
    set({ definicao });
    persistir(definicao);
  },

  excluirNo: (id) => {
    const definicaoAtual = get().definicao;
    const nos = definicaoAtual.nos.filter((no) => no.id !== id);
    const conexoes = definicaoAtual.conexoes.filter((c) => c.de !== id && c.para !== id);
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      nos,
      conexoes,
      no_inicial: definicaoAtual.no_inicial === id ? nos[0]?.id ?? "" : definicaoAtual.no_inicial,
    };
    const selecaoAtual = get().selecao;
    set({
      definicao,
      selecao: selecaoAtual?.tipo === "no" && selecaoAtual.id === id ? null : selecaoAtual,
      ...revalidar(definicao),
    });
    persistir(definicao);
  },

  definirNoInicial: (id) => {
    const definicao: DefinicaoBot = { ...get().definicao, no_inicial: id };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  conectar: (de, para) => {
    if (de === para) return;
    const definicaoAtual = get().definicao;
    const conexao: ConexaoBot = { de, para, condicao: null };
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      conexoes: [...definicaoAtual.conexoes, conexao],
    };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  atualizarCondicaoConexao: (index, condicao) => {
    const definicaoAtual = get().definicao;
    const conexoes = definicaoAtual.conexoes.map((c, i) => (i === index ? { ...c, condicao } : c));
    const definicao: DefinicaoBot = { ...definicaoAtual, conexoes };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  excluirConexao: (index) => {
    const definicaoAtual = get().definicao;
    const conexoes = definicaoAtual.conexoes.filter((_, i) => i !== index);
    const definicao: DefinicaoBot = { ...definicaoAtual, conexoes };
    const selecaoAtual = get().selecao;
    set({
      definicao,
      selecao: selecaoAtual?.tipo === "conexao" ? null : selecaoAtual,
      ...revalidar(definicao),
    });
    persistir(definicao);
  },

  atualizarMeta: (alteracoes) => {
    const definicao: DefinicaoBot = { ...get().definicao, ...alteracoes };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  adicionarVariavel: () => {
    const definicaoAtual = get().definicao;
    const nova: VariavelBot = {
      chave: `variavel_${definicaoAtual.variaveis.length + 1}`,
      tipo: "texto",
      obrigatoria: false,
    };
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      variaveis: [...definicaoAtual.variaveis, nova],
    };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  atualizarVariavel: (index, alteracoes) => {
    const definicaoAtual = get().definicao;
    const variaveis = definicaoAtual.variaveis.map((v, i) =>
      i === index ? { ...v, ...alteracoes } : v,
    );
    const definicao: DefinicaoBot = { ...definicaoAtual, variaveis };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  excluirVariavel: (index) => {
    const definicaoAtual = get().definicao;
    const variaveis = definicaoAtual.variaveis.filter((_, i) => i !== index);
    const definicao: DefinicaoBot = { ...definicaoAtual, variaveis };
    set({ definicao, ...revalidar(definicao) });
    persistir(definicao);
  },

  exportarJSON: () => JSON.stringify(get().definicao, null, 2),

  importarJSON: (texto) => {
    let bruto: unknown;
    try {
      bruto = JSON.parse(texto);
    } catch {
      set({ erroImportacao: "Arquivo não é um JSON válido." });
      return;
    }
    const resultado = validarDefinicao(bruto);
    if (!resultado.ok) {
      const primeiro = resultado.erros[0];
      set({
        erroImportacao: primeiro
          ? `${primeiro.regra}: ${primeiro.mensagem}`
          : "Definição inválida.",
      });
      return;
    }
    const definicao = comPosicoesCompletas(resultado.definicao);
    set({
      definicao,
      selecao: null,
      erroImportacao: null,
      ...revalidar(definicao),
    });
    persistir(definicao);
  },

  restaurarExemplo: () => {
    const definicao = comPosicoesCompletas(definicaoExemploValida());
    set({ definicao, selecao: null, erroImportacao: null, ...revalidar(definicao) });
    persistir(definicao);
  },

  carregarDefinicao: (entrada) => {
    const resultado = validarDefinicao(entrada);
    if (!resultado.ok) return;
    const definicao = comPosicoesCompletas(structuredClone(resultado.definicao));
    set({ definicao, selecao: null, erroImportacao: null, ...revalidar(definicao) });
    persistir(definicao);
  },

  organizarLayout: () => {
    const definicaoAtual = get().definicao;
    const definicao: DefinicaoBot = {
      ...definicaoAtual,
      metadados_editor: { posicoes: layoutEmCamadas(definicaoAtual) },
    };
    set({ definicao });
    persistir(definicao);
  },
}));
