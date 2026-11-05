# Development workflow

This repository uses the [Superpowers](https://github.com/obra/superpowers)
workflow (plugin version 7.0.1 or later) for agent-assisted changes. Keep the
plugin installed in the coding harness; this file keeps the project-specific
rules available to every contributor and agent.

## Required flow

1. Clarify the requested outcome and inspect the affected package before
   changing code. For work with meaningful product or architectural impact,
   agree on a short design before implementation.
2. Work test-first whenever behavior changes: add or adjust a focused failing
   test, implement the smallest change, then refactor only after it is green.
3. Before handoff, run the checks for every package touched and report any
   intentionally skipped integration checks.

## Monorepo boundaries

- `frontend/` is a Next.js client. It must not import backend, database,
  Prisma, or server-only authentication code.
- `financeiro-api/` owns REST endpoints, persistence, authentication, and the
  compatibility contract. Preserve response envelopes and paths unless the
  migration contract is deliberately updated with tests.
- `financeiro-mobile/` is the Expo client and communicates with the API only.
- The extracted applications are the source of truth. Do not reintroduce a
  monolith or a proxy fallback without an explicit architecture decision.

## Verification commands

- Web: `cd frontend; npm test; npm run lint`
- API: `cd financeiro-api; npm test`
- Mobile: `cd financeiro-mobile; npm run typecheck`
- Database integration tests require a disposable homologation database and
  `RUN_DATABASE_TESTS=true`; never point them at production data.
