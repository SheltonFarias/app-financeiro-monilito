/**
 * database.js — Singleton de conexão com o banco de dados via Prisma (PostgreSQL/Supabase).
 * Prisma 7: usa driver adapter (@prisma/adapter-pg) em vez de conexão embutida no schema.
 * O padrão com global.prisma evita múltiplas instâncias durante o hot-reload do Next.js.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Pool de conexões PostgreSQL — conexão direta ao Supabase (sem pgBouncer)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


const adapter = new PrismaPg(pool);

/** @type {import('@prisma/client').PrismaClient} */
const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Em desenvolvimento, reutiliza a instância entre hot-reloads do Next.js
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

module.exports = { prisma };

