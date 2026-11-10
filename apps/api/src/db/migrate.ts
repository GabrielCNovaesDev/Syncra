import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { getMigrations } from "better-auth/db/migration";
import { auth, authPool } from "../auth.js";

const url = process.env.DATABASE_URL ?? "postgres://syncra:syncra@localhost:5432/syncra";
const dir = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(dir, "../../drizzle/0001_init.sql");

const sql = postgres(url, { max: 1 });
const script = readFileSync(sqlFile, "utf8");

await sql.unsafe(script);
console.log("Migração 0001_init aplicada.");

const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
const authLink = readFileSync(join(dir, "../../drizzle/0002_auth_link.sql"), "utf8");
await sql.unsafe(authLink);
await sql.end();
await authPool.end();
console.log("Tabelas Better Auth e vínculo de conta atualizados.");
