import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createRelatoriosService } from '../src/modules/relatorios/service.js';
import { getRelatorios } from '../src/modules/relatorios/controller.js';
import { login } from '../src/modules/auth/service.js';

test('relatórios agrupam categorias e projetam saldo', async () => {
  const prisma = { receita: { findMany: async () => [{ mes: 'Junho2026', valor: 100 }] }, gastoFixo: { findMany: async () => [{ mes: 'Junho2026', categoria: 'Moradia', valor: 30 }] }, gastoVariavel: { findMany: async () => [{ mes: 'Junho2026', categoria: 'Lazer', valor: 10, recorrente: true }] } };
  const service = createRelatoriosService(prisma);
  assert.deepEqual(await service.agruparPorCategoria('Junho2026'), [{ name: 'Moradia', value: 30 }, { name: 'Lazer', value: 10 }]);
  assert.deepEqual((await service.gerarProjecao('Junho2026', 1)).map((item) => item.saldo), [60, 120]);
});

test('controller mantém validação de mês do legado', async () => {
  const auth = { passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro' };
  const { token } = await login('senha', auth);
  const result = await getRelatorios(new Request('https://api.exemplo.com/api/relatorios?tipo=categoria', { headers: { authorization: `Bearer ${token}` } }), { auth, relatoriosService: {} });
  assert.deepEqual(result, { status: 400, body: { success: false, error: 'Parâmetro mes é obrigatório' } });
});
