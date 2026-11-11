import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { eq } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { db } from "./db/client.js";
import { contas, usuarios } from "./db/schema.js";

export async function contextoDaConta(req: { headers: IncomingHttpHeaders }) {
  const sessao = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!sessao) return null;

  let [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.authUserId, sessao.user.id))
    .limit(1);

  if (!usuario) {
    const agora = new Date();
    const contaId = randomUUID();
    try {
      await db.transaction(async (tx) => {
        await tx.insert(contas).values({
          id: contaId,
          nome: `Workspace de ${sessao.user.name}`,
          criadoEm: agora,
        });
        await tx.insert(usuarios).values({
          id: randomUUID(),
          authUserId: sessao.user.id,
          contaId,
          email: sessao.user.email,
          nome: sessao.user.name,
          papel: "dono",
          criadoEm: agora,
        });
      });
    } catch (erro) {
      // Duas requisições de uma conta recém-criada podem chegar juntas.
      if ((erro as { code?: string }).code !== "23505") throw erro;
    }
    [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.authUserId, sessao.user.id))
      .limit(1);
    if (!usuario) throw new Error("Não foi possível vincular a conta ao usuário autenticado.");
  }

  const [conta] = await db.select().from(contas).where(eq(contas.id, usuario.contaId)).limit(1);
  if (!conta || conta.excluidoEm) return null;
  return { usuario, conta };
}
