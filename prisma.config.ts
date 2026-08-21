// Prisma 7 — conexão com Supabase
// DATABASE_URL: Transaction pooler (porta 6543) — usado em runtime
// DIRECT_URL:   Conexão direta  (porta 5432) — usado pelo CLI (db push / migrate)
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
    directUrl: process.env["DIRECT_URL"],
  },
});
