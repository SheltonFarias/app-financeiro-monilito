import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Migrações precisam de conexão persistente; em produção prefira DIRECT_URL.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
