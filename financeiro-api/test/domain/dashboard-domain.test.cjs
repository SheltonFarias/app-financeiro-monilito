const test = require('node:test');
const assert = require('node:assert/strict');
const { createDashboardService, getMesAnterior } = require('../../src/domain/dashboard.cjs');

function dependencies() {
  return {
    gastosFixosService: { listarPorMes: async () => [] },
    gastosVariaveisRepository: { findByMes: async () => [], create: async () => {} },
    receitasService: { listarPorMes: async () => [] },
    receitasRepository: { findAll: async () => [] },
    gastosFixosRepository: { findAll: async () => [] },
    investimentosRepository: { findAll: async () => [] },
    orcamentosRepository: { findByMes: async () => [] },
    metasRepository: { findAll: async () => [] },
    cartoesRepository: { findAll: async () => [] },
  };
}

test('calcula a virada do ano ao localizar o mês anterior', () => {
  assert.equal(getMesAnterior('Janeiro2026'), 'Dezembro2025');
  assert.equal(getMesAnterior('Junho2026'), 'Maio2026');
  assert.equal(getMesAnterior('Invalido'), null);
});

test('domínio mantém o erro de mês obrigatório independente do adaptador', async () => {
  const service = createDashboardService(dependencies(), (message, statusCode) => ({ message, statusCode }));
  await assert.rejects(
    () => service.carregarDados(),
    (error) => error.message === 'Parâmetro "mes" é obrigatório.' && error.statusCode === 400,
  );
});
