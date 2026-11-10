import "dotenv/config";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret || secret.length < 32 || secret === "troque-por-32-caracteres-aleatorios") {
  throw new Error("BETTER_AUTH_SECRET precisa ter ao menos 32 caracteres.");
}

export const authPool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://syncra:syncra@localhost:5432/syncra",
});

export const auth = betterAuth({
  database: authPool,
  secret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:5173"],
  emailAndPassword: { enabled: true },
});
