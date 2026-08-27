import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL ?? "postgres://syncra:syncra@localhost:5432/syncra";

export const client = postgres(url);
export const db = drizzle(client, { schema });
