import test from 'node:test';
import assert from 'node:assert/strict';
import { createCotacoesService } from '../src/modules/cotacoes/service.js';

test('usa Yahoo Finance para dividendos quando a Brapi falha', async () => {
  const prisma = {
    controleRequisicao: {
      findUnique: async () => ({ mes_ano_referencia: new Date().toISOString().slice(0, 7), total_requisicoes: 2 }),
      update: async () => {},
    },
  };
  const service = createCotacoesService(prisma, {
    fetchImpl: async (url) => {
      if (url.includes('brapi.dev')) return { ok: false, status: 403 };
      return {
        ok: true,
        json: async () => ({ chart: { result: [{ events: { dividends: {
          primeiro: { date: Math.floor(Date.now() / 1000), amount: 0.31 },
          segundo: { date: Math.floor(Date.now() / 1000), amount: 0.29 },
        } } }] } }),
      };
    },
  });

  const resultado = await service.busca({ ticker: 'BBAS3' });
  assert.deepEqual(resultado, { dividendoAnual: 0.6, fonte: 'yahoo_finance' });
});
