# Financeiro API

API REST independente do aplicativo financeiro. Ela preserva os caminhos `/api/...`, o JWT e os envelopes de resposta consumidos pelo frontend web e pelo aplicativo mobile, mas não encaminha requisições ao monólito.

## Executar

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `AUTH_PASSWORD_HASH`, `JWT_SECRET` e, quando aplicável, os segredos Brapi e Telegram.
2. Gere o cliente Prisma: `npm run prisma:generate`.
3. Inicie a API: `npm start`.
4. No frontend, defina `NEXT_PUBLIC_API_URL=http://localhost:3001`.

Endpoints operacionais: `GET /health` e `GET /ready`.

## Deploy na Vercel

O diretÃ³rio `financeiro-api/` deve ser usado como **Root Directory** do projeto na Vercel. O adaptador em `api/[...path].js` publica as rotas existentes sob `/api/*`, sem iniciar um servidor persistente. O `postinstall` executa `prisma generate` para deixar o cliente Prisma disponÃ­vel na Function.

1. Importe o repositÃ³rio na Vercel e selecione `financeiro-api` como diretÃ³rio-raiz.
2. Configure as variÃ¡veis de ambiente de produÃ§Ã£o: `DATABASE_URL`, `DIRECT_URL`, `AUTH_USER`, `AUTH_PASSWORD_HASH`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS` e, se usados, `BRAPI_TOKEN`, `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_SECRET`. Em um banco Supabase, `DIRECT_URL` deve ser uma conexÃ£o direta ou de pool de sessÃ£o, nunca a URL do Transaction Pooler (porta 6543); ela Ã© usada pelo Prisma para aplicar migraÃ§Ãµes no build.
3. Em `CORS_ORIGINS`, informe a URL pÃºblica exata do frontend, sem barra no final. Para um ambiente local, mantenha `http://localhost:3000` separado por vÃ­rgula.
4. Defina `NEXT_PUBLIC_API_URL` no frontend com a URL da API publicada, por exemplo `https://sua-api.vercel.app`.
5. Valide `GET /api/health` apÃ³s o deploy.

O `vercel.json` limita cada Function a 60 segundos. Dados persistentes devem continuar no PostgreSQL; o sistema de arquivos da Function Ã© efÃªmero.

## Qualidade

- `npm test`: testes unitários e de transporte.
- `$env:RUN_DATABASE_TESTS='true'; npm run test:database`: integração PostgreSQL, com rollback das escritas de teste.

O inventário em `src/migration-manifest.js` é a fonte de verdade para a superfície compatível da API. Rotas desconhecidas respondem `404`; não há fallback para o monólito.
