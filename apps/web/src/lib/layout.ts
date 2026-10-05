import type { DefinicaoBot } from "@syncra/shared";

type Posicoes = Record<string, { x: number; y: number }>;

const ESPACO_X = 290;
const ESPACO_Y = 170;
const MAX_COLUNAS = 4;

/**
 * Distribui os nós em colunas pela distância (BFS) a partir do nó inicial.
 * Nós inalcançáveis vão para uma coluna extra, à direita.
 */
export function layoutEmCamadas(definicao: DefinicaoBot): Posicoes {
  const profundidade = new Map<string, number>();
  if (definicao.nos.some((n) => n.id === definicao.no_inicial)) {
    profundidade.set(definicao.no_inicial, 0);
    const fila = [definicao.no_inicial];
    while (fila.length > 0) {
      const atual = fila.shift()!;
      for (const c of definicao.conexoes) {
        if (c.de === atual && !profundidade.has(c.para)) {
          profundidade.set(c.para, profundidade.get(atual)! + 1);
          fila.push(c.para);
        }
      }
    }
  }
  const colunaOrfaos = Math.max(-1, ...profundidade.values()) + 1;
  const porCamada = new Map<number, number>();
  const linhaDoNo = new Map<string, number>();
  for (const no of definicao.nos) {
    const camada = profundidade.get(no.id) ?? colunaOrfaos;
    const linha = porCamada.get(camada) ?? 0;
    porCamada.set(camada, linha + 1);
    linhaDoNo.set(no.id, linha);
  }

  // Fluxos longos quebram em faixas de MAX_COLUNAS para caber na tela.
  const alturaFaixa = Math.max(1, ...porCamada.values()) * ESPACO_Y + 60;
  const posicoes: Posicoes = {};
  for (const no of definicao.nos) {
    const camada = profundidade.get(no.id) ?? colunaOrfaos;
    const faixa = Math.floor(camada / MAX_COLUNAS);
    posicoes[no.id] = {
      x: 40 + (camada % MAX_COLUNAS) * ESPACO_X,
      y: 60 + faixa * alturaFaixa + linhaDoNo.get(no.id)! * ESPACO_Y,
    };
  }
  return posicoes;
}

/** Completa posições ausentes; se faltar alguma, reorganiza tudo para evitar sobreposição. */
export function comPosicoesCompletas(definicao: DefinicaoBot): DefinicaoBot {
  const atuais = definicao.metadados_editor?.posicoes ?? {};
  if (definicao.nos.every((n) => atuais[n.id])) return definicao;
  return { ...definicao, metadados_editor: { posicoes: layoutEmCamadas(definicao) } };
}
