import cors from "cors";
import express from "express";
import { validarDefinicao } from "@syncra/shared";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin, credentials: true }));
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

app.listen(port, () => {
  console.log(`Syncra API em http://localhost:${port}`);
});
