const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
    console.log("Tables in public schema:", result.map(r => r.table_name));
  } catch (err) {
    console.error("Error connecting:", err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
