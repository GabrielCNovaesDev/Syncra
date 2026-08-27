import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "./client.js";
import { planos } from "./schema.js";

const STARTER_ID = "11111111-1111-4111-8111-111111111111";

async function seed() {
  const existente = await db.select().from(planos).where(eq(planos.id, STARTER_ID));
  if (existente.length > 0) {
    console.log("Seed já aplicado.");
    return;
  }

  await db.insert(planos).values({
    id: STARTER_ID,
    nome: "Starter",
    precoCentavos: 0,
    tetoMensagensMes: 1000,
    maxBots: 5,
    ativo: true,
  });

  await db.insert(planos).values({
    id: uuid(),
    nome: "Ilimitado (piloto)",
    precoCentavos: 0,
    tetoMensagensMes: null,
    maxBots: 20,
    ativo: true,
  });

  console.log("Planos seed gravados.");
}

await seed();
process.exit(0);
