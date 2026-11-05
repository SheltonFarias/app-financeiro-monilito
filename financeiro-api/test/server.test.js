import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createServer } from '../src/server.js';

async function start(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

test('não encaminha rota desconhecida a serviço externo', async (t) => {
  const server = createServer({
    port: 0,
    corsOrigins: new Set(['https://web.exemplo.com']),
  });
  t.after(() => server.close());

  const baseUrl = await start(server);
  const response = await fetch(`${baseUrl}/api/gastos-fixos?mes=Junho2026`, {
    method: 'GET',
    headers: {
      Origin: 'https://web.exemplo.com',
      Authorization: 'Bearer token-de-teste',
      'Content-Type': 'application/json',
    },
  });

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://web.exemplo.com');
  assert.deepEqual(await response.json(), { success: false, error: 'Rota não encontrada.' });
});

test('expõe health check sem depender de serviço externo', async (t) => {
  const server = createServer({
    port: 0,
    corsOrigins: new Set(),
  });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
});

test('exposes health check through the Vercel Function path', async (t) => {
  const server = createServer({ port: 0, corsOrigins: new Set() });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
});

test('autentica localmente sem encaminhar login a serviço externo', async (t) => {
  const server = createServer({
    port: 0,
    corsOrigins: new Set(),
    auth: {
      passwordHash: await bcrypt.hash('senha-correta', 4),
      jwtSecret: 'segredo-de-teste-com-tamanho-suficiente',
      jwtExpiresIn: '8h',
      username: 'financeiro',
    },
  });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: 'senha-correta' }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
});

test('atende dashboard localmente quando o serviço nativo está configurado', async (t) => {
  const auth = {
    passwordHash: await bcrypt.hash('senha-correta', 4),
    jwtSecret: 'segredo-de-teste-com-tamanho-suficiente',
    jwtExpiresIn: '8h',
    username: 'financeiro',
  };
  const { login } = await import('../src/modules/auth/service.js');
  const { token } = await login('senha-correta', auth);
  const server = createServer({ port: 0, corsOrigins: new Set(), auth }, undefined, {
    dashboardService: { carregarDados: async (mes) => ({ mes, gastosFixos: [] }) },
  });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/dashboard?mes=Junho2026`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { mes: 'Junho2026', gastosFixos: [] } });
});

test('atende histórico do dashboard localmente quando o serviço nativo está configurado', async (t) => {
  const auth = {
    passwordHash: await bcrypt.hash('senha-correta', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro',
  };
  const { login } = await import('../src/modules/auth/service.js');
  const { token } = await login('senha-correta', auth);
  const server = createServer({ port: 0, corsOrigins: new Set(), auth }, undefined, {
    dashboardService: { carregarHistorico: async () => ({ gastosFixos: [], gastosVariaveis: [], receitas: [] }) },
  });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/dashboard/historico`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { gastosFixos: [], gastosVariaveis: [], receitas: [] } });
});

test('atende configurações localmente quando o serviço nativo está configurado', async (t) => {
  const auth = { passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro' };
  const { login } = await import('../src/modules/auth/service.js');
  const { token } = await login('senha', auth);
  const server = createServer({ port: 0, corsOrigins: new Set(), auth }, undefined, { configuracoesService: { getAllParsed: async () => ({ tema: 'escuro' }) } });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/configuracoes`, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { tema: 'escuro' } });
});

test('atualiza configurações localmente quando o serviço nativo está configurado', async (t) => {
  const auth = { passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro' };
  const { login } = await import('../src/modules/auth/service.js');
  const { token } = await login('senha', auth);
  const server = createServer({ port: 0, corsOrigins: new Set(), auth }, undefined, { configuracoesService: { updateConfig: async (chave, valor) => ({ chave, valor }) } });
  t.after(() => server.close());

  const response = await fetch(`${await start(server)}/api/configuracoes`, {
    method: 'PUT', headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ chave: 'tema', valor: 'escuro' }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { chave: 'tema', valor: 'escuro' } });
});
