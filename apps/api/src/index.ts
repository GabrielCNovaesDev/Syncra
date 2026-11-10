import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { validarDefinicao } from "@syncra/shared";
import { auth } from "./auth.js";
import { botsRouter } from "./bots.js";
import { contextoDaConta } from "./contexto.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin, credentials: true }));
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, servico: "syncra-api", etapa: "E1" });
});

app.post("/definicoes/validar", (req, res) => {
  const resultado = validarDefinicao(req.body);
  if (!resultado.ok) {
    res.status(400).json(resultado);
    return;
  }
  res.json(resultado);
});

app.get("/api/me", (req, res) => {
  void contextoDaConta(req).then((contexto) => {
    if (!contexto) { res.sendStatus(401); return; }
    res.json({
      usuario: { id: contexto.usuario.id, nome: contexto.usuario.nome, email: contexto.usuario.email },
      conta: { id: contexto.conta.id, nome: contexto.conta.nome },
    });
  }).catch((erro) => {
    console.error("Erro ao consultar a conta:", erro);
    res.status(500).json({ erro: "Erro interno." });
  });
});
app.use("/api/bots", botsRouter);

app.listen(port, () => {
  console.log(`Syncra API em http://localhost:${port}`);
});
