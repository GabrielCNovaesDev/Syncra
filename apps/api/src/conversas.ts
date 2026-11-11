import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import { validarDefinicao } from "@syncra/shared";
import { contextoDaConta } from "./contexto.js";
import { db } from "./db/client.js";
import { bots, botVersoes, conversas, mensagens } from "./db/schema.js";

export const conversasRouter: Router = Router();

function rota(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    void handler(req, res).catch((erro) => {
      console.error("Erro na rota de conversas:", erro);
      if (!res.headersSent) res.status(500).json({ erro: "Erro interno." });
    });
  };
}

export async function conversaDaConta(id: string, contaId: string) {
  const [registro] = await db.select({ conversa: conversas, versao: botVersoes })
    .from(conversas)
    .innerJoin(bots, eq(conversas.botId, bots.id))
    .innerJoin(botVersoes, eq(conversas.botVersaoId, botVersoes.id))
    .where(and(eq(conversas.id, id), eq(bots.contaId, contaId), isNull(bots.excluidoEm)))
    .limit(1);
  if (!registro) return null;
  const validacao = validarDefinicao(registro.versao.definicao);
  if (!validacao.ok) throw new Error("Versão do bot inválida no banco.");
  return { ...registro, definicao: validacao.definicao };
}

conversasRouter.post("/", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const botId = req.body?.botId;
  if (typeof botId !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(botId)) {
    res.status(400).json({ erro: "Bot inválido." }); return;
  }
  const [bot] = await db.select().from(bots).where(and(
    eq(bots.id, botId), eq(bots.contaId, contexto.conta.id), isNull(bots.excluidoEm),
  )).limit(1);
  if (!bot) { res.sendStatus(404); return; }
  const [versao] = await db.select().from(botVersoes).where(eq(botVersoes.botId, bot.id))
    .orderBy(desc(botVersoes.numero)).limit(1);
  if (!versao) { res.sendStatus(404); return; }
  const validacao = validarDefinicao(versao.definicao);
  if (!validacao.ok) { res.status(409).json({ erro: "A versão do bot é inválida." }); return; }
  const agora = new Date();
  const expurgo = new Date(agora.getTime() + 90 * 24 * 60 * 60 * 1000);
  const id = randomUUID();
  await db.insert(conversas).values({
    id, botId: bot.id, botVersaoId: versao.id, canal: "web", estado: "ativa",
    noAtual: validacao.definicao.no_inicial, variaveis: {},
    iniciadaEm: agora, expurgoEm: expurgo,
  });
  res.status(201).json({ id, botId: bot.id, botVersaoId: versao.id, versao: versao.numero });
}));

conversasRouter.get("/:id", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = req.params.id;
  if (typeof id !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
    res.sendStatus(404); return;
  }
  const registro = await conversaDaConta(id, contexto.conta.id);
  if (!registro) { res.sendStatus(404); return; }
  const historico = await db.select({
    id: mensagens.id, papel: mensagens.papel, conteudo: mensagens.conteudo,
    noId: mensagens.noId, criadaEm: mensagens.criadaEm,
  }).from(mensagens).where(eq(mensagens.conversaId, id)).orderBy(asc(mensagens.criadaEm));
  res.json({
    id, botId: registro.conversa.botId, botVersaoId: registro.versao.id,
    versao: registro.versao.numero, estado: registro.conversa.estado,
    noAtual: registro.conversa.noAtual, variaveis: registro.conversa.variaveis,
    mensagens: historico,
  });
}));
