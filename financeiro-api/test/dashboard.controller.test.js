import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { getDashboard, getDashboardHistory } from '../src/modules/dashboard/controller.js';
import { login } from '../src/modules/auth/service.js';

const auth = {
  passwordHash: await bcrypt.hash('senha-de-teste', 4),
  jwtSecret: 'segredo-de-teste-com-tamanho-suficiente',
  jwtExpiresIn: '8h',
  username: 'financeiro',
};

test('controller do dashboard preserva query e envelope de sucesso', async () => {
  const { token } = await login('senha-de-teste', auth);
  let mesRecebido;
  const result = await getDashboard(new Request('https://api.exemplo.com/api/dashboard?mes=Junho2026', {
    headers: { authorization: `Bearer ${token}` },
  }), {
    auth,
    dashboardService: { carregarDados: async (mes) => { mesRecebido = mes; return { gastosFixos: [] }; } },
  });

  assert.equal(mesRecebido, 'Junho2026');
  assert.deepEqual(result, { status: 200, body: { success: true, data: { gastosFixos: [] } } });
});

test('controller do dashboard preserva erro de autorização', async () => {
  const result = await getDashboard(new Request('https://api.exemplo.com/api/dashboard?mes=Junho2026'), {
    auth,
    dashboardService: { carregarDados: async () => ({}) },
  });

  assert.deepEqual(result, {
    status: 401,
    body: { success: false, error: 'Token não fornecido.' },
  });
});

test('controller do histórico preserva envelope e não recebe query de mês', async () => {
  const { token } = await login('senha-de-teste', auth);
  const result = await getDashboardHistory(new Request('https://api.exemplo.com/api/dashboard/historico', {
    headers: { authorization: `Bearer ${token}` },
  }), {
    auth,
    dashboardService: { carregarHistorico: async () => ({ gastosFixos: [], gastosVariaveis: [], receitas: [] }) },
  });

  assert.deepEqual(result, {
    status: 200,
    body: { success: true, data: { gastosFixos: [], gastosVariaveis: [], receitas: [] } },
  });
});
