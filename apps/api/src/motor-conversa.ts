import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { aposRespostaIa, interpretarTurno, type EstadoConversa } from "@syncra/engine";
import type { DefinicaoBot, NoBot } from "@syncra/shared";
import { desc, eq } from "drizzle-orm";
import type { Socket } from "socket.io";
import { conversaDaConta } from "./conversas.js";
import { db } from "./db/client.js";
import { conversas, mensagens } from "./db/schema.js";

type NoIa = Extract<NoBot, { tipo: "ia" }>;
export type ResponderIa = (
  definicao: DefinicaoBot, no: NoIa, conversaId: string,
  variaveis: Record<string, unknown>, aoDelta: (trecho: string) => void,
) => Promise<{ texto: string; tokensEntrada: number; tokensSaida: number }>;

function interpolar(texto: string, variaveis: Record<string, unknown>) {
  return texto.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g,
    (_, chave: string) => String(variaveis[chave] ?? ""));
}

async function responderIa(
  definicao: DefinicaoBot,
  no: NoIa,
  conversaId: string,
  variaveis: Record<string, unknown>,
  aoDelta: (trecho: string) => void,
) {
  const chave = process.env.ANTHROPIC_API_KEY;
  const modelo = no.modelo === "modelo-rapido"
    ? process.env.ANTHROPIC_MODEL_FAST : process.env.ANTHROPIC_MODEL_QUALITY;
  if (!chave || !modelo) throw new Error("Configure ANTHROPIC_API_KEY e os modelos na API para usar nós de IA.");

  const recentes = await db.select({ papel: mensagens.papel, conteudo: mensagens.conteudo })
    .from(mensagens).where(eq(mensagens.conversaId, conversaId))
    .orderBy(desc(mensagens.criadaEm)).limit(12);
  const historico = no.usar_historico ? recentes.reverse() : recentes.filter((m) => m.papel === "usuario").slice(0, 1);
  const entrada = historico.map((m) => ({
    role: m.papel === "usuario" ? "user" as const : "assistant" as const,
    content: m.conteudo,
  }));
  if (entrada.length === 0 || entrada.at(-1)?.role !== "user") {
    entrada.push({ role: "user", content: "Continue a conversa seguindo a instrução desta etapa." });
  }
  const instrucao = interpolar([definicao.instrucao_global, no.instrucao].filter(Boolean).join("\n\n"), variaveis);
  const cliente = new Anthropic({ apiKey: chave });
  const stream = cliente.messages.stream({
    model: modelo, max_tokens: 512, system: instrucao || "Responda de forma útil e objetiva.",
    messages: entrada,
  });
  stream.on("text", aoDelta);
  const final = await stream.finalMessage();
  const texto = final.content.filter((bloco) => bloco.type === "text").map((bloco) => bloco.text).join("");
  if (!texto.trim()) throw new Error("O modelo não retornou texto.");
  return { texto, tokensEntrada: final.usage.input_tokens, tokensSaida: final.usage.output_tokens };
}

function estadoDoRegistro(registro: NonNullable<Awaited<ReturnType<typeof conversaDaConta>>>): EstadoConversa {
  const estado = registro.conversa.estado;
  if (estado !== "ativa" && estado !== "aguardando_entrada" && estado !== "encerrada" && estado !== "bloqueada") {
    throw new Error("Estado de conversa desconhecido.");
  }
  return {
    no_atual: registro.conversa.noAtual ?? registro.definicao.no_inicial,
    variaveis: registro.conversa.variaveis as Record<string, unknown>,
    estado,
  };
}

export async function avancarConversa(
  conversaId: string,
  contaId: string,
  texto: string | undefined,
  socket: Socket,
  gerarResposta: ResponderIa = responderIa,
) {
  const registro = await conversaDaConta(conversaId, contaId);
  if (!registro) throw new Error("Conversa não encontrada nesta conta.");
  const { definicao } = registro;
  let estado = estadoDoRegistro(registro);
  if (estado.estado === "encerrada" || estado.estado === "bloqueada") {
    socket.emit("conversa:estado", { estado: estado.estado, noAtual: estado.no_atual });
    return;
  }
  if (estado.estado === "aguardando_entrada" && (!texto || !texto.trim())) {
    socket.emit("conversa:estado", { estado: estado.estado, noAtual: estado.no_atual });
    return;
  }
  if (estado.estado !== "aguardando_entrada" && texto !== undefined) {
    throw new Error("A conversa não está aguardando uma resposta.");
  }

  let entrada = texto?.trim();
  for (let passo = 0; passo < 40; passo += 1) {
    const resultado = interpretarTurno(definicao, estado, entrada);
    const mensagensFixas = resultado.acoes.filter((acao) => acao.tipo !== "chamar_ia")
      .map((acao) => ({
        id: randomUUID(), papel: "assistente", conteudo: acao.texto,
        noId: acao.no_id, criadaEm: new Date(),
      }));
    const mensagemUsuario = entrada === undefined ? null : {
      id: randomUUID(), papel: "usuario", conteudo: entrada,
      noId: estado.no_atual, criadaEm: new Date(),
    };
    await db.transaction(async (tx) => {
      if (mensagemUsuario) await tx.insert(mensagens).values({ conversaId, ...mensagemUsuario });
      for (const mensagem of mensagensFixas) {
        await tx.insert(mensagens).values({ conversaId, ...mensagem });
      }
      await tx.update(conversas).set({
        noAtual: resultado.estado.no_atual, variaveis: resultado.estado.variaveis,
        estado: resultado.estado.estado,
        encerradaEm: resultado.estado.estado === "encerrada" ? new Date() : null,
      }).where(eq(conversas.id, conversaId));
    });
    if (mensagemUsuario) socket.emit("conversa:mensagem", mensagemUsuario);
    for (const mensagem of mensagensFixas) socket.emit("conversa:mensagem", mensagem);
    estado = resultado.estado;
    entrada = undefined;

    const chamada = resultado.acoes.find((acao) => acao.tipo === "chamar_ia");
    if (!chamada || chamada.tipo !== "chamar_ia") {
      socket.emit("conversa:estado", { estado: estado.estado, noAtual: estado.no_atual });
      return;
    }

    const resposta = await gerarResposta(definicao, chamada.no, conversaId, estado.variaveis,
      (trecho) => socket.emit("conversa:delta", { trecho, noId: chamada.no_id }));
    const mensagemIa = {
      id: randomUUID(), papel: "assistente", conteudo: resposta.texto,
      noId: chamada.no_id, criadaEm: new Date(),
      tokensEntrada: resposta.tokensEntrada, tokensSaida: resposta.tokensSaida,
    };
    const seguinte = aposRespostaIa(definicao, estado);
    await db.transaction(async (tx) => {
      await tx.insert(mensagens).values({ conversaId, ...mensagemIa });
      await tx.update(conversas).set({
        noAtual: seguinte.no_atual, variaveis: seguinte.variaveis,
        estado: seguinte.estado, encerradaEm: seguinte.estado === "encerrada" ? new Date() : null,
      }).where(eq(conversas.id, conversaId));
    });
    socket.emit("conversa:mensagem", mensagemIa);
    estado = seguinte;
    if (estado.estado !== "ativa") {
      socket.emit("conversa:estado", { estado: estado.estado, noAtual: estado.no_atual });
      return;
    }
  }
  throw new Error("Limite de etapas da conversa atingido.");
}
