import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export function createPrismaClient(databaseUrl) {
  if (!databaseUrl) throw new Error('DATABASE_URL é obrigatória para acessar o banco.');
  const pool = new Pool({ connectionString: databaseUrl });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
