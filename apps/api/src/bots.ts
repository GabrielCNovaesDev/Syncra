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
