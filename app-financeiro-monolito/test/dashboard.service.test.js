const test = require('node:test');
const assert = require('node:assert/strict');
const { createDashboardService } = require('../src/backend/modules/dashboard/dashboard.service');

function criarDependencias({ gastosVariaveisAnteriores = [], gastosVariaveisAtuais = [] } = {}) {
  const criados = [];
  const repositorioVariaveis = {
    findByMes: async (mes) => (mes === 'Maio2026' ? gastosVariaveisAnteriores : gastosVariaveisAtuais),
    create: async (dados) => criados.push(dados),
    findAll: async () => ['variavel-historico'],
  };
  return {
    criados,
    dependencias: {
      gastosFixosService: { listarPorMes: async () => ['fixo'] },
      gastosVariaveisRepository: repositorioVariaveis,
      receitasService: { listarPorMes: async () => ['receita'] },
      receitasRepository: { findAll: async () => ['receita-historico'] },
      gastosFixosRepository: { findAll: async () => ['fixo-historico'] },
      investimentosRepository: { findAll: async () => ['investimento'] },
      orcamentosRepository: { findByMes: async () => ['orcamento'] },
      metasRepository: { findAll: async () => ['meta'] },
      cartoesRepository: { findAll: async () => ['cartao'] },
    },
  };
}

test('dashboard copia somente recorrência ainda ausente no mês atual', async () => {
  const { criados, dependencias } = criarDependencias({
    gastosVariaveisAnteriores: [
      { descricao: 'Streaming', valor: 39.9, recorrente: true, categoria: 'Lazer', pagamento: 'Pix' },
      { descricao: 'Único', valor: 10, recorrente: false },
    ],
    gastosVariaveisAtuais: [],
  });

  const resultado = await createDashboardService(dependencias).carregarDados('Junho2026');

  assert.equal(criados.length, 1);
  assert.deepEqual(criados[0], {
    descricao: 'Streaming', valor: 39.9, recorrente: true, categoria: 'Lazer', pagamento: 'Pix',
    parcela: undefined, data_compra: undefined, situacao: 'Pendente', mes: 'Junho2026',
    subcategoria: undefined, frequencia: undefined, tags: undefined,
  });
  assert.deepEqual(resultado, {
    gastosFixos: ['fixo'], gastosVariaveis: [], receitas: ['receita'], investimentos: ['investimento'],
    orcamentos: ['orcamento'], metas: ['meta'], cartoes: ['cartao'],
  });
});

test('dashboard não duplica recorrência já existente', async () => {
  const recorrente = { descricao: 'Streaming', valor: 39.9, recorrente: true };
  const { criados, dependencias } = criarDependencias({
    gastosVariaveisAnteriores: [recorrente],
    gastosVariaveisAtuais: [recorrente],
  });

  await createDashboardService(dependencias).carregarDados('Junho2026');
  assert.deepEqual(criados, []);
});

test('dashboard exige mês de referência', async () => {
  const { dependencias } = criarDependencias();
  await assert.rejects(
    () => createDashboardService(dependencias).carregarDados(),
    (error) => error.statusCode === 400 && error.message === 'Parâmetro "mes" é obrigatório.',
  );
});
