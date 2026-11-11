import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import { validarDefinicao } from "@syncra/shared";
import { contextoDaConta } from "./contexto.js";
import { db } from "./db/client.js";
import { bots, botVersoes } from "./db/schema.js";

export const botsRouter: Router = Router();

function rota(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response) => {
    void handler(req, res).catch((erro) => {
      console.error("Erro na rota de bots:", erro);
      if (!res.headersSent) res.status(500).json({ erro: "Erro interno." });
    });
  };
}

function idDaRota(req: Request): string | null {
  const id = req.params.id;
  return typeof id === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

function numeroDaRota(req: Request): number | null {
  const valor = req.params.numero;
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

async function botDaConta(id: string, contaId: string) {
  const [bot] = await db.select().from(bots).where(and(
    eq(bots.id, id), eq(bots.contaId, contaId), isNull(bots.excluidoEm),
  )).limit(1);
  return bot;
}

botsRouter.get("/", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const lista = await db
    .select({ id: bots.id, nome: bots.nome, criadoEm: bots.criadoEm })
    .from(bots)
    .where(and(eq(bots.contaId, contexto.conta.id), isNull(bots.excluidoEm)))
    .orderBy(desc(bots.criadoEm));
  res.json({ bots: lista });
}));

botsRouter.post("/", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const validacao = validarDefinicao(req.body);
  if (!validacao.ok) { res.status(400).json(validacao); return; }
  const id = randomUUID();
  const versaoId = randomUUID();
  const agora = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(bots).values({
      id, contaId: contexto.conta.id, nome: validacao.definicao.nome,
      ativo: true, criadoEm: agora,
    });
    await tx.insert(botVersoes).values({
      id: versaoId, botId: id, numero: 1, definicao: validacao.definicao,
      modoCriacao: "visual", criadoEm: agora,
    });
  });
  res.status(201).json({ id, versao: 1, definicao: validacao.definicao });
}));

botsRouter.get("/:id", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = idDaRota(req);
  if (!id) { res.sendStatus(404); return; }
  const [bot] = await db.select().from(bots).where(and(
    eq(bots.id, id), eq(bots.contaId, contexto.conta.id), isNull(bots.excluidoEm),
  )).limit(1);
  if (!bot) { res.sendStatus(404); return; }
  const [versao] = await db.select().from(botVersoes)
    .where(eq(botVersoes.botId, bot.id)).orderBy(desc(botVersoes.numero)).limit(1);
  if (!versao) { res.sendStatus(404); return; }
  res.json({ id: bot.id, nome: bot.nome, versao: versao.numero, definicao: versao.definicao });
}));

botsRouter.get("/:id/versoes", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = idDaRota(req);
  if (!id || !await botDaConta(id, contexto.conta.id)) { res.sendStatus(404); return; }
  const versoes = await db.select({ numero: botVersoes.numero, criadoEm: botVersoes.criadoEm })
    .from(botVersoes).where(eq(botVersoes.botId, id)).orderBy(desc(botVersoes.numero));
  res.json({ versoes });
}));

botsRouter.get("/:id/versoes/:numero", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = idDaRota(req);
  const numero = numeroDaRota(req);
  if (!id || !numero || !await botDaConta(id, contexto.conta.id)) { res.sendStatus(404); return; }
  const [versao] = await db.select().from(botVersoes).where(and(
    eq(botVersoes.botId, id), eq(botVersoes.numero, numero),
  )).limit(1);
  if (!versao) { res.sendStatus(404); return; }
  res.json({ numero: versao.numero, criadoEm: versao.criadoEm, definicao: versao.definicao });
}));

botsRouter.post("/:id/versoes/:numero/restaurar", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = idDaRota(req);
  const numeroOrigem = numeroDaRota(req);
  if (!id || !numeroOrigem) { res.sendStatus(404); return; }
  const restaurada = await db.transaction(async (tx) => {
    const [bot] = await tx.select().from(bots).where(and(
      eq(bots.id, id), eq(bots.contaId, contexto.conta.id), isNull(bots.excluidoEm),
    )).for("update").limit(1);
    if (!bot) return null;
    const [origem] = await tx.select().from(botVersoes).where(and(
      eq(botVersoes.botId, id), eq(botVersoes.numero, numeroOrigem),
    )).limit(1);
    if (!origem) return null;
    const validacao = validarDefinicao(origem.definicao);
    if (!validacao.ok) throw new Error("A versão de origem é inválida.");
    const [ultima] = await tx.select({ numero: botVersoes.numero }).from(botVersoes)
      .where(eq(botVersoes.botId, id)).orderBy(desc(botVersoes.numero)).limit(1);
    const numero = (ultima?.numero ?? 0) + 1;
    await tx.insert(botVersoes).values({
      id: randomUUID(), botId: id, numero, definicao: validacao.definicao,
      modoCriacao: origem.modoCriacao, criadoEm: new Date(),
    });
    await tx.update(bots).set({ nome: validacao.definicao.nome }).where(eq(bots.id, id));
    return { id, versao: numero, origem: numeroOrigem, definicao: validacao.definicao };
  });
  if (!restaurada) { res.sendStatus(404); return; }
  res.status(201).json(restaurada);
}));

botsRouter.put("/:id", rota(async (req, res) => {
  const contexto = await contextoDaConta(req);
  if (!contexto) { res.sendStatus(401); return; }
  const id = idDaRota(req);
  if (!id) { res.sendStatus(404); return; }
  const validacao = validarDefinicao(req.body);
  if (!validacao.ok) { res.status(400).json(validacao); return; }
  const salvo = await db.transaction(async (tx) => {
    const [bot] = await tx.select().from(bots).where(and(
      eq(bots.id, id), eq(bots.contaId, contexto.conta.id), isNull(bots.excluidoEm),
    )).for("update").limit(1);
    if (!bot) return null;
    const [ultima] = await tx.select({ numero: botVersoes.numero }).from(botVersoes)
      .where(eq(botVersoes.botId, bot.id)).orderBy(desc(botVersoes.numero)).limit(1);
    const numero = (ultima?.numero ?? 0) + 1;
    await tx.insert(botVersoes).values({
      id: randomUUID(), botId: bot.id, numero, definicao: validacao.definicao,
      modoCriacao: "visual", criadoEm: new Date(),
    });
    await tx.update(bots).set({ nome: validacao.definicao.nome }).where(eq(bots.id, bot.id));
    return { id: bot.id, versao: numero, definicao: validacao.definicao };
  });
  if (!salvo) { res.sendStatus(404); return; }
  res.json(salvo);
}));
