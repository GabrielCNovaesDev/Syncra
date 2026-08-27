import type { ConexaoBot, DefinicaoBot, NoBot } from "@syncra/shared";

export type EstadoConversa = {
  no_atual: string;
  variaveis: Record<string, unknown>;
  estado: "ativa" | "encerrada" | "bloqueada" | "aguardando_entrada";
};

export type AcaoMotor =
  | { tipo: "falar"; texto: string; no_id: string }
  | { tipo: "perguntar"; texto: string; no_id: string; variavel_destino: string }
  | { tipo: "chamar_ia"; no: Extract<NoBot, { tipo: "ia" }>; no_id: string }
  | { tipo: "encerrar"; texto: string; no_id: string };

function noPorId(definicao: DefinicaoBot, id: string): NoBot {
  const no = definicao.nos.find((n) => n.id === id);
  if (!no) {
    throw new Error(`Nó ${id} não existe na definição.`);
  }
  return no;
}

function saidas(definicao: DefinicaoBot, de: string): ConexaoBot[] {
  return definicao.conexoes.filter((c) => c.de === de);
}

function truthy(valor: unknown): boolean {
  if (valor === null || valor === undefined || valor === false || valor === "") return false;
  return true;
}

function avaliarCondicao(expressao: string, variaveis: Record<string, unknown>): boolean {
  const chave = expressao.trim().split(/\s+/)[0] ?? "";
  return truthy(variaveis[chave]);
}

function escolherSaida(
  definicao: DefinicaoBot,
  no: Extract<NoBot, { tipo: "condicao" }>,
  variaveis: Record<string, unknown>,
): string {
  const opcoes = saidas(definicao, no.id);
  const passou = avaliarCondicao(no.expressao, variaveis);
  const preferida = passou
    ? opcoes.find((c) => c.condicao && c.condicao !== "else")
    : opcoes.find((c) => c.condicao === "else");
  const escolhida = preferida ?? opcoes[passou ? 0 : opcoes.length - 1];
  if (!escolhida) {
    throw new Error(`Condição ${no.id} sem saída utilizável.`);
  }
  return escolhida.para;
}

function unicaSaida(definicao: DefinicaoBot, de: string): string | null {
  const opcoes = saidas(definicao, de);
  return opcoes[0]?.para ?? null;
}

/**
 * Interpreta o grafo no turno atual. Nós `ia` são devolvidos como ação para o
 * backend chamar o modelo — o motor não conhece a Anthropic.
 */
export function interpretarTurno(
  definicao: DefinicaoBot,
  estado: EstadoConversa,
  entradaUsuario?: string,
): { estado: EstadoConversa; acoes: AcaoMotor[] } {
  if (estado.estado === "encerrada" || estado.estado === "bloqueada") {
    return { estado, acoes: [] };
  }

  let noId = estado.no_atual;
  let variaveis = { ...estado.variaveis };
  const acoes: AcaoMotor[] = [];

  if (estado.estado === "aguardando_entrada") {
    const no = noPorId(definicao, noId);
    if (no.tipo !== "pergunta") {
      throw new Error("Estado aguardando_entrada fora de um nó pergunta.");
    }
    variaveis = { ...variaveis, [no.variavel_destino]: entradaUsuario ?? "" };
    const proximo = unicaSaida(definicao, no.id);
    if (!proximo) {
      return {
        estado: { no_atual: no.id, variaveis, estado: "encerrada" },
        acoes: [],
      };
    }
    noId = proximo;
  }

  const visitados = new Set<string>();

  while (true) {
    if (visitados.has(noId)) {
      throw new Error("Laço detectado na interpretação sem espera de entrada.");
    }
    visitados.add(noId);

    const no = noPorId(definicao, noId);

    if (no.tipo === "mensagem") {
      acoes.push({ tipo: "falar", texto: interpolar(no.texto, variaveis), no_id: no.id });
      const proximo = unicaSaida(definicao, no.id);
      if (!proximo) {
        return { estado: { no_atual: no.id, variaveis, estado: "encerrada" }, acoes };
      }
      noId = proximo;
      continue;
    }

    if (no.tipo === "pergunta") {
      acoes.push({
        tipo: "perguntar",
        texto: interpolar(no.texto, variaveis),
        no_id: no.id,
        variavel_destino: no.variavel_destino,
      });
      return {
        estado: { no_atual: no.id, variaveis, estado: "aguardando_entrada" },
        acoes,
      };
    }

    if (no.tipo === "ia") {
      acoes.push({ tipo: "chamar_ia", no, no_id: no.id });
      return {
        estado: { no_atual: no.id, variaveis, estado: "ativa" },
        acoes,
      };
    }

    if (no.tipo === "condicao") {
      noId = escolherSaida(definicao, no, variaveis);
      continue;
    }

    acoes.push({ tipo: "encerrar", texto: interpolar(no.texto_final, variaveis), no_id: no.id });
    return { estado: { no_atual: no.id, variaveis, estado: "encerrada" }, acoes };
  }
}

export function estadoInicial(definicao: DefinicaoBot): EstadoConversa {
  return {
    no_atual: definicao.no_inicial,
    variaveis: {},
    estado: "ativa",
  };
}

function interpolar(texto: string, variaveis: Record<string, unknown>): string {
  return texto.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (_, chave: string) =>
    String(variaveis[chave] ?? ""),
  );
}

/** Avança o ponteiro depois que o nó `ia` já produziu a fala. */
export function aposRespostaIa(definicao: DefinicaoBot, estado: EstadoConversa): EstadoConversa {
  const proximo = unicaSaida(definicao, estado.no_atual);
  if (!proximo) {
    return { ...estado, estado: "encerrada" };
  }
  return { ...estado, no_atual: proximo, estado: "ativa" };
}
