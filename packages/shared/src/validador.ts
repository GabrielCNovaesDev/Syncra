import { DefinicaoBot } from "./definicao.js";
import type { ConexaoBot, DefinicaoBot as Definicao, NoBot } from "./definicao.js";

export type CodigoRegra =
  | "SCHEMA"
  | "V-01"
  | "V-02"
  | "V-03"
  | "V-04"
  | "V-05"
  | "V-06"
  | "V-07"
  | "V-08";

export type ErroValidacao = {
  regra: CodigoRegra;
  mensagem: string;
  no_id?: string;
};

export type ResultadoValidacao =
  | { ok: true; definicao: Definicao }
  | { ok: false; erros: ErroValidacao[] };

const PALAVRAS_RESERVADAS = new Set([
  "true",
  "false",
  "and",
  "or",
  "not",
  "e",
  "ou",
  "nao",
  "null",
  "in",
  "eq",
  "ne",
  "gt",
  "lt",
]);

function mapaNos(definicao: Definicao): Map<string, NoBot> {
  return new Map(definicao.nos.map((no) => [no.id, no]));
}

function saidasPorNo(conexoes: ConexaoBot[]): Map<string, string[]> {
  const mapa = new Map<string, string[]>();
  for (const c of conexoes) {
    const lista = mapa.get(c.de) ?? [];
    lista.push(c.para);
    mapa.set(c.de, lista);
  }
  return mapa;
}

function alcancaveis(inicio: string, saidas: Map<string, string[]>): Set<string> {
  const visto = new Set<string>();
  const fila = [inicio];
  while (fila.length > 0) {
    const atual = fila.shift()!;
    if (visto.has(atual)) continue;
    visto.add(atual);
    for (const prox of saidas.get(atual) ?? []) {
      if (!visto.has(prox)) fila.push(prox);
    }
  }
  return visto;
}

function temCiclo(nosIds: string[], saidas: Map<string, string[]>): boolean {
  const BRANCO = 0;
  const CINZA = 1;
  const PRETO = 2;
  const cor = new Map(nosIds.map((id) => [id, BRANCO]));

  const dfs = (id: string): boolean => {
    cor.set(id, CINZA);
    for (const prox of saidas.get(id) ?? []) {
      if (!cor.has(prox)) continue;
      const c = cor.get(prox);
      if (c === CINZA) return true;
      if (c === BRANCO && dfs(prox)) return true;
    }
    cor.set(id, PRETO);
    return false;
  };

  for (const id of nosIds) {
    if (cor.get(id) === BRANCO && dfs(id)) return true;
  }
  return false;
}

function extraiaChaves(texto: string): string[] {
  const mustache = [...texto.matchAll(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g)].map(
    (m) => m[1],
  );
  const identificadores = [...texto.matchAll(/\b([a-z][a-z0-9_]*)\b/g)]
    .map((m) => m[1])
    .filter((t) => !PALAVRAS_RESERVADAS.has(t));
  return [...new Set([...mustache, ...identificadores])];
}

export function validarDefinicao(entrada: unknown): ResultadoValidacao {
  const parse = DefinicaoBot.safeParse(entrada);
  if (!parse.success) {
    return {
      ok: false,
      erros: parse.error.issues.map((issue) => ({
        regra: "SCHEMA",
        mensagem: issue.message,
      })),
    };
  }

  const definicao = parse.data;
  const erros: ErroValidacao[] = [];
  const nos = mapaNos(definicao);
  const ids = definicao.nos.map((n) => n.id);

  if (new Set(ids).size !== ids.length) {
    erros.push({ regra: "V-02", mensagem: "Todo id de nó precisa ser único dentro do bot." });
  }

  if (!nos.has(definicao.no_inicial)) {
    erros.push({
      regra: "V-01",
      mensagem: "no_inicial precisa existir na lista de nós.",
      no_id: definicao.no_inicial,
    });
  }

  for (const conexao of definicao.conexoes) {
    if (!nos.has(conexao.de) || !nos.has(conexao.para)) {
      erros.push({
        regra: "V-03",
        mensagem: `Conexão aponta para nó inexistente: ${conexao.de} → ${conexao.para}.`,
      });
    }
  }

  const saidas = saidasPorNo(definicao.conexoes);

  if (nos.has(definicao.no_inicial)) {
    const visiveis = alcancaveis(definicao.no_inicial, saidas);
    for (const no of definicao.nos) {
      if (!visiveis.has(no.id)) {
        erros.push({
          regra: "V-04",
          mensagem: `Nó órfão, inalcançável a partir do nó inicial: ${no.id}.`,
          no_id: no.id,
        });
      }
    }

    const chegaEncerramento = definicao.nos.some(
      (n) => n.tipo === "encerramento" && visiveis.has(n.id),
    );
    if (!chegaEncerramento) {
      erros.push({
        regra: "V-08",
        mensagem: "É preciso existir ao menos um caminho até um nó de encerramento.",
      });
    }
  }

  for (const no of definicao.nos) {
    if (no.tipo !== "condicao") continue;
    const qtd = (saidas.get(no.id) ?? []).length;
    if (qtd < 2) {
      erros.push({
        regra: "V-05",
        mensagem: "Todo nó do tipo condicao precisa de ao menos duas saídas.",
        no_id: no.id,
      });
    }
  }

  const declaradas = new Set(definicao.variaveis.map((v) => v.chave));
  if (declaradas.size !== definicao.variaveis.length) {
    erros.push({ regra: "V-06", mensagem: "Chaves de variáveis duplicadas na declaração." });
  }

  for (const no of definicao.nos) {
    if (no.tipo === "pergunta" && !declaradas.has(no.variavel_destino)) {
      erros.push({
        regra: "V-06",
        mensagem: `Variável ${no.variavel_destino} não foi declarada.`,
        no_id: no.id,
      });
    }
    if (no.tipo === "condicao") {
      for (const chave of extraiaChaves(no.expressao)) {
        if (!declaradas.has(chave)) {
          erros.push({
            regra: "V-06",
            mensagem: `Expressão referencia variável não declarada: ${chave}.`,
            no_id: no.id,
          });
        }
      }
    }
  }

  const espera = new Set(
    definicao.nos.filter((n) => n.tipo === "pergunta").map((n) => n.id),
  );
  const idsSemEspera = definicao.nos.filter((n) => !espera.has(n.id)).map((n) => n.id);
  const saidasSemEspera = new Map<string, string[]>();
  for (const id of idsSemEspera) {
    saidasSemEspera.set(
      id,
      (saidas.get(id) ?? []).filter((para) => !espera.has(para) && idsSemEspera.includes(para)),
    );
  }
  if (temCiclo(idsSemEspera, saidasSemEspera)) {
    erros.push({
      regra: "V-07",
      mensagem: "Há ciclo sem nó de espera de entrada (pergunta), o que pode gerar laço infinito.",
    });
  }

  if (erros.length > 0) {
    return { ok: false, erros };
  }
  return { ok: true, definicao };
}

export function definicaoExemploValida(): Definicao {
  return {
    versao_schema: 1,
    nome: "Atendimento — dúvidas de matrícula",
    modelo_padrao: "modelo-rapido",
    instrucao_global: "Você atende alunos. Seja objetivo.",
    no_inicial: "no_boas_vindas",
    variaveis: [{ chave: "nome_aluno", tipo: "texto", obrigatoria: false }],
    nos: [
      { id: "no_boas_vindas", tipo: "mensagem", texto: "Olá! Vou te ajudar com a matrícula." },
      {
        id: "no_coleta_nome",
        tipo: "pergunta",
        texto: "Qual é o seu nome?",
        variavel_destino: "nome_aluno",
      },
      {
        id: "no_tem_nome",
        tipo: "condicao",
        expressao: "nome_aluno",
      },
      {
        id: "no_resposta_ia",
        tipo: "ia",
        instrucao: "Responda dúvidas de matrícula para {{nome_aluno}}.",
        modelo: "modelo-qualidade",
        usar_historico: true,
      },
      { id: "no_fim", tipo: "encerramento", texto_final: "Até logo." },
    ],
    conexoes: [
      { de: "no_boas_vindas", para: "no_coleta_nome", condicao: null },
      { de: "no_coleta_nome", para: "no_tem_nome", condicao: null },
      { de: "no_tem_nome", para: "no_resposta_ia", condicao: "truthy" },
      { de: "no_tem_nome", para: "no_fim", condicao: "else" },
      { de: "no_resposta_ia", para: "no_fim", condicao: null },
    ],
    metadados_editor: {
      posicoes: { no_boas_vindas: { x: 120, y: 80 } },
    },
  };
}
