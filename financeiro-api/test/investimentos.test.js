import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvestimentosService } from '../src/modules/investimentos/service.js';
test('investimentos normalizam ticker e bloqueiam duplicidade', async () => {
  const rows = []; const prisma = { investimento: { findMany: async () => rows, findUnique: async ({ where }) => rows.find((r) => r.id === where.id || r.ticker === where.ticker) ?? null, create: async ({ data }) => { const row = { id: 'i1', ...data }; rows.push(row); return row; }, update: async ({ where, data }) => Object.assign(rows.find((r) => r.id === where.id), data), delete: async ({ where }) => rows.splice(rows.findIndex((r) => r.id === where.id), 1)[0] } };
  const service = createInvestimentosService(prisma);
  const item = await service.criar({ ticker: 'petr4', tipo: 'Ação', quantidade: 1, precoMedio: 10 });
  assert.equal(item.ticker, 'PETR4');
  await assert.rejects(() => service.criar({ ticker: 'PETR4', tipo: 'Ação', quantidade: 1, precoMedio: 10 }), { statusCode: 409 });
});
