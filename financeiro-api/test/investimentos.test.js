import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvestimentosService } from '../src/modules/investimentos/service.js';

function criarPrismaEmMemoria() {
  const rows = [];
  return {
    rows,
    prisma: {
      investimento: {
        findMany: async () => rows,
        findUnique: async ({ where }) => rows.find((row) => row.id === where.id || row.ticker === where.ticker) ?? null,
        create: async ({ data }) => {
          const row = { id: `i${rows.length + 1}`, ...data };
          rows.push(row);
          return row;
        },
        update: async ({ where, data }) => Object.assign(rows.find((row) => row.id === where.id), data),
        delete: async ({ where }) => rows.splice(rows.findIndex((row) => row.id === where.id), 1)[0],
      },
    },
  };
}

test('investimentos normalizam ticker e consolidam novos aportes', async () => {
  const { prisma } = criarPrismaEmMemoria();
  const service = createInvestimentosService(prisma);

  const primeiro = await service.criar({ ticker: 'petr4', tipo: 'Ação', quantidade: 1, precoMedio: 10 });
  const consolidado = await service.criar({ ticker: 'PETR4', tipo: 'Ação', quantidade: 3, precoMedio: 20 });

  assert.equal(primeiro.ticker, 'PETR4');
  assert.equal(consolidado.id, primeiro.id);
  assert.equal(consolidado.quantidade, 4);
  assert.equal(consolidado.preco_medio, 17.5);
});

test('não permite consolidar o mesmo ticker em classes diferentes', async () => {
  const { prisma } = criarPrismaEmMemoria();
  const service = createInvestimentosService(prisma);
  await service.criar({ ticker: 'MXRF11', tipo: 'FII', quantidade: 1, precoMedio: 10 });

  await assert.rejects(
    () => service.criar({ ticker: 'MXRF11', tipo: 'ETF', quantidade: 1, precoMedio: 10 }),
    { statusCode: 409 },
  );
});
