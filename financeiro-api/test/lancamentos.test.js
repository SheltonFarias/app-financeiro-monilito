import test from 'node:test';
import assert from 'node:assert/strict';
import { createLancamentosService } from '../src/modules/lancamentos/service.js';

function prismaFalso() {
  const rows = { gastoFixo: [], gastoVariavel: [], receita: [], meta: [] };
  const delegate = (key) => ({
    findMany: async ({ where = {} } = {}) => rows[key].filter((row) => {
      if (typeof where.mes === 'string' && row.mes !== where.mes) return false;
      if (where.mes?.not && row.mes === where.mes.not) return false;
      if (where.template_id === null && row.template_id !== undefined && row.template_id !== null) return false;
      if (where.template_id?.not === null && (row.template_id === undefined || row.template_id === null)) return false;
      return true;
    }),
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

test('receita recorrente cria somente uma cópia pendente no mês consultado', async () => {
  const prisma = prismaFalso();
  const service = createLancamentosService(prisma, 'receita');
  await service.criar({ categoria: 'Trabalho', descricao: 'Salário', valor: 10, mes: 'Junho2026', mensal: 1, situacao: 'Recebido' });
  assert.equal((await service.listarPorMes('Julho2026')).length, 1);
  assert.equal((await service.listarPorMes('Julho2026'))[0].situacao, 'Pendente');
});
