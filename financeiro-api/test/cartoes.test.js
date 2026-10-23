import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createCartoesService } from '../src/modules/cartoes/service.js';
import { getCartoes } from '../src/modules/cartoes/controller.js';
import { login } from '../src/modules/auth/service.js';

test('lista cartões ordenados por criação', async () => {
  let query;
  const service = createCartoesService({ cartaoCredito: { findMany: async (args) => { query = args; return [{ id: '1' }]; } } });
  assert.deepEqual(await service.listar(), [{ id: '1' }]);
  assert.deepEqual(query, { orderBy: { created_at: 'asc' } });
});
test('controller de cartões preserva envelope', async () => {
  const auth = { passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro' };
  const { token } = await login('senha', auth);
  const result = await getCartoes(new Request('https://api.exemplo.com/api/cartoes', { headers: { authorization: `Bearer ${token}` } }), { auth, cartoesService: { listar: async () => [] } });
  assert.deepEqual(result, { status: 200, body: { success: true, data: [] } });
});

test('cria, atualiza e remove cartão validando existência', async () => {
  const calls = [];
  const card = { id: '1', nome: 'Visa', limite_total: 1000, dia_fechamento: 10, dia_vencimento: 20 };
  const service = createCartoesService({ cartaoCredito: {
    create: async ({ data }) => { calls.push(['create', data]); return { id: '1', ...data }; },
    findUnique: async () => card,
    update: async ({ data }) => { calls.push(['update', data]); return { ...card, ...data }; },
    delete: async ({ where }) => { calls.push(['delete', where]); },
  } });
  assert.equal((await service.criar(card)).id, '1');
  assert.equal((await service.atualizar('1', card)).nome, 'Visa');
  assert.deepEqual(await service.deletar('1'), { id: '1' });
  assert.equal(calls.length, 3);
});
