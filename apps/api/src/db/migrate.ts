import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://syncra:syncra@localhost:5432/syncra";
const dir = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(dir, "../../drizzle/0001_init.sql");

const sql = postgres(url, { max: 1 });
const script = readFileSync(sqlFile, "utf8");

await sql.unsafe(script);
await sql.end();
console.log("Migração 0001_init aplicada.");
