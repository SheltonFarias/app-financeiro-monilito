import test from 'node:test';
import assert from 'node:assert/strict';
import { createLancamentosService } from '../src/modules/lancamentos/service.js';

function prismaFalso() {
  const rows = { gastoFixo: [], gastoVariavel: [], receita: [], meta: [] };
  const corresponde = (row, where) => Object.entries(where).every(([campo, valor]) => {
    if (campo === 'OR') return valor.some((condicao) => corresponde(row, condicao));
    if (campo === 'AND') return valor.every((condicao) => corresponde(row, condicao));
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      if ('not' in valor && (valor.not === null ? row[campo] == null : row[campo] === valor.not)) return false;
      if ('notIn' in valor && valor.notIn.includes(row[campo])) return false;
      if ('gte' in valor && !(row[campo] >= valor.gte)) return false;
      if ('lte' in valor && !(row[campo] <= valor.lte)) return false;
      return true;
    }
    return valor === null ? row[campo] == null : row[campo] === valor;
  });
  const delegate = (key) => ({
    findMany: async ({ where = {} } = {}) => rows[key].filter((row) => corresponde(row, where)),
    findUnique: async ({ where }) => rows[key].find((row) => row.id === where.id) ?? null,
    findFirst: async ({ where }) => rows[key].find((row) => Object.entries(where).every(([k, v]) => row[k] === v)) ?? null,
    create: async ({ data }) => { const row = { id: `${key}-${rows[key].length + 1}`, created_at: new Date(), ...data }; rows[key].push(row); return row; },
    update: async ({ where, data }) => { const row = rows[key].find((item) => item.id === where.id); Object.assign(row, data); return row; },
    delete: async ({ where }) => { const i = rows[key].findIndex((row) => row.id === where.id); return rows[key].splice(i, 1)[0]; },
    deleteMany: async ({ where }) => { const before = rows[key].length; rows[key] = rows[key].filter((row) => !Object.entries(where).every(([k, v]) => row[k] === v)); return { count: before - rows[key].length }; },
    updateMany: async () => ({ count: 0 }),
  });
  const prisma = { gastoFixo: delegate('gastoFixo'), gastoVariavel: delegate('gastoVariavel'), receita: delegate('receita'), meta: delegate('meta'), $transaction: async (work) => typeof work === 'function' ? work(prisma) : Promise.all(work) };
  return prisma;
}

test('gasto variável parcela a compra em meses consecutivos', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'variavel');
  const first = await service.criar({ categoria: 'Casa', descricao: 'Seguro', valor: 100, pagamento: 'Pix', mes: 'Dezembro2026', qtd_parcelas: 2 });
  assert.equal(first.descricao, 'Seguro (1/2)');
  assert.equal((await service.listarPorMes('Janeiro2027'))[0].descricao, 'Seguro (2/2)');
});

test('gasto variavel preserva o dia de vencimento informado', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'variavel');

  const gasto = await service.criar({ categoria: 'Casa', descricao: 'Internet', valor: 100, pagamento: 'Cartao Inter', vencimento: '8', mes: 'Junho2026' });

  assert.equal(gasto.vencimento, '8');
});

test('receita recorrente cria somente uma cópia pendente no mês consultado', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'receita');
  await service.criar({ categoria: 'Trabalho', descricao: 'Salário', valor: 10, mes: 'Junho2026', mensal: 1, situacao: 'Recebido' });
  assert.equal((await service.listarPorMes('Julho2026')).length, 1);
  assert.equal((await service.listarPorMes('Julho2026'))[0].situacao, 'Pendente');
});

test('encerrar recorrência a partir de um mês preserva o histórico anterior', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'receita');
  await service.criar({ categoria: 'Trabalho', descricao: 'Salário', valor: 10, mes: 'Novembro2026', mensal: true, situacao: 'Recebido' });
  const [dezembro] = await service.listarPorMes('Dezembro2026');

  await service.removerDaquiEmDiante(dezembro.id);

  const [novembro] = await service.listarPorMes('Novembro2026');
  assert.equal(novembro.descricao, 'Salário');
  assert.equal(novembro.mensal, false);
  assert.deepEqual(await service.listarPorMes('Dezembro2026'), []);
  assert.deepEqual(await service.listarPorMes('Janeiro2027'), []);
});

test('excluir parcelas a partir de um mês preserva as parcelas anteriores', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'variavel');
  await service.criar({ categoria: 'Casa', descricao: 'Seguro', valor: 90, pagamento: 'Pix', mes: 'Novembro2026', qtd_parcelas: 3 });
  const [dezembro] = await service.listarPorMes('Dezembro2026');

  await service.removerDaquiEmDiante(dezembro.id);

  assert.equal((await service.listarPorMes('Novembro2026')).length, 1);
  assert.deepEqual(await service.listarPorMes('Dezembro2026'), []);
  assert.deepEqual(await service.listarPorMes('Janeiro2027'), []);
});
