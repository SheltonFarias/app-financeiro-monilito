import test from 'node:test';
import assert from 'node:assert/strict';
import { createCotacoesService } from '../src/modules/cotacoes/service.js';

test('busca preenche o dividendo anual quando a Brapi devolve rate como texto', async () => {
  const prisma = {
    controleRequisicao: {
      findUnique: async () => ({ mes_ano_referencia: new Date().toISOString().slice(0, 7), total_requisicoes: 2 }),
      update: async () => {},
    },
  };
  const service = createCotacoesService(prisma, {
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ results: [{ dividendsData: { cashDividends: [
        { paymentDate: new Date().toISOString(), rate: '0.31' },
        { paymentDate: new Date().toISOString(), rate: '0.29' },
      ] } }] }),
    }),
  });

  const resultado = await service.busca({ ticker: 'BBAS3' });
  assert.equal(resultado.dividendoAnual, 0.6);
});
