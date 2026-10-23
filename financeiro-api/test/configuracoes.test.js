import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createConfiguracoesService } from '../src/modules/configuracoes/service.js';
import { getConfiguracoes, putConfiguracoes } from '../src/modules/configuracoes/controller.js';
import { login } from '../src/modules/auth/service.js';

test('serviço de configurações converte JSON e preserva valores simples', async () => {
  const service = createConfiguracoesService({
    configuracao: { findMany: async () => [
      { chave: 'categorias', valor: '["Moradia"]' },
      { chave: 'tema', valor: 'escuro' },
    ] },
  });
  assert.deepEqual(await service.getAllParsed(), { categorias: ['Moradia'], tema: 'escuro' });
});

test('controller de configurações mantém autenticação e envelope', async () => {
  const auth = {
    passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro',
  };
  const { token } = await login('senha', auth);
  const result = await getConfiguracoes(new Request('https://api.exemplo.com/api/configuracoes', {
    headers: { authorization: `Bearer ${token}` },
  }), { auth, configuracoesService: { getAllParsed: async () => ({ tema: 'escuro' }) } });
  assert.deepEqual(result, { status: 200, body: { success: true, data: { tema: 'escuro' } } });
});

test('atualiza configurações com JSON e exige chave', async () => {
  let upsert;
  const service = createConfiguracoesService({
    configuracao: { upsert: async (dados) => { upsert = dados; } },
  });
  assert.deepEqual(await service.updateConfig('categorias', ['Moradia']), { chave: 'categorias', valor: ['Moradia'] });
  assert.deepEqual(upsert, {
    where: { chave: 'categorias' },
    create: { chave: 'categorias', valor: '["Moradia"]' },
    update: { valor: '["Moradia"]' },
  });
  await assert.rejects(() => service.updateConfig('', 'x'), /A chave é obrigatória/);
});

test('controller de atualização preserva o envelope', async () => {
  const auth = {
    passwordHash: await bcrypt.hash('senha', 4), jwtSecret: 'segredo-de-teste-com-tamanho-suficiente', jwtExpiresIn: '8h', username: 'financeiro',
  };
  const { token } = await login('senha', auth);
  const result = await putConfiguracoes(new Request('https://api.exemplo.com/api/configuracoes', {
    method: 'PUT', headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ chave: 'tema', valor: 'escuro' }),
  }), { auth, configuracoesService: { updateConfig: async (chave, valor) => ({ chave, valor }) } });
  assert.deepEqual(result, { status: 200, body: { success: true, data: { chave: 'tema', valor: 'escuro' } } });
});
