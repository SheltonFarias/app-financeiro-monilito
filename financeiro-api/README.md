# Financeiro API

API REST independente do aplicativo financeiro. Ela preserva os caminhos `/api/...`, o JWT e os envelopes de resposta consumidos pelo frontend web e pelo aplicativo mobile, mas não encaminha requisições ao monólito.

## Executar

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `AUTH_PASSWORD_HASH`, `JWT_SECRET` e, quando aplicável, os segredos Brapi e Telegram.
2. Gere o cliente Prisma: `npm run prisma:generate`.
3. Inicie a API: `npm start`.
4. No frontend, defina `NEXT_PUBLIC_API_URL=http://localhost:3001`.

Endpoints operacionais: `GET /health` e `GET /ready`.

## Qualidade

- `npm test`: testes unitários e de transporte.
- `$env:RUN_DATABASE_TESTS='true'; npm run test:database`: integração PostgreSQL, com rollback das escritas de teste.

O inventário em `src/migration-manifest.js` é a fonte de verdade para a superfície compatível da API. Rotas desconhecidas respondem `404`; não há fallback para o monólito.
