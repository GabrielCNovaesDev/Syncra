import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { contextoDaConta } from "./contexto.js";
import { avancarConversa } from "./motor-conversa.js";

const emAndamento = new Set<string>();

export function conectarSocket(httpServer: HttpServer, origin: string) {
  const io = new Server(httpServer, { cors: { origin, credentials: true } });
  io.use((socket, next) => {
    void contextoDaConta({ headers: socket.handshake.headers }).then((contexto) => {
      if (!contexto) { next(new Error("Sessão inválida.")); return; }
      socket.data.contaId = contexto.conta.id;
      next();
    }).catch(() => next(new Error("Não foi possível autenticar a conexão.")));
  });
  io.on("connection", (socket) => {
    socket.on("conversa:avancar", (dados: { conversaId?: string; texto?: string }, responder?: (r: { ok: boolean; erro?: string }) => void) => {
      const conversaId = dados?.conversaId;
      if (!conversaId || typeof conversaId !== "string" ||
          (dados.texto !== undefined && (typeof dados.texto !== "string" || dados.texto.length > 4000))) {
        responder?.({ ok: false, erro: "Dados inválidos." }); return;
      }
      if (emAndamento.has(conversaId)) {
        responder?.({ ok: false, erro: "A conversa já está processando uma resposta." }); return;
      }
      emAndamento.add(conversaId);
      void avancarConversa(conversaId, socket.data.contaId as string, dados.texto, socket)
        .then(() => responder?.({ ok: true }))
        .catch((erro) => {
          const mensagem = erro instanceof Error ? erro.message : "Erro na conversa.";
          socket.emit("conversa:erro", { erro: mensagem });
          responder?.({ ok: false, erro: mensagem });
        })
        .finally(() => emAndamento.delete(conversaId));
    });
  });
  return io;
}
