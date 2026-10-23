import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { authorize } from '../src/modules/auth/authorize.js';
import { login } from '../src/modules/auth/service.js';

const auth = {
  passwordHash: await bcrypt.hash('senha-de-teste', 4),
  jwtSecret: 'segredo-de-teste-com-tamanho-suficiente',
  jwtExpiresIn: '8h',
  username: 'financeiro',
};

test('autoriza JWT compatível com o login da API', async () => {
  const { token } = await login('senha-de-teste', auth);
  const payload = await authorize(new Headers({ authorization: `Bearer ${token}` }), auth);
  assert.equal(payload.authenticated, true);
  assert.equal(payload.username, 'financeiro');
});

test('rejeita token ausente e token inválido com o contrato legado', async () => {
  await assert.rejects(
    () => authorize(new Headers(), auth),
    (error) => error.statusCode === 401 && error.message === 'Token não fornecido.',
  );
  await assert.rejects(
    () => authorize(new Headers({ authorization: 'Bearer inválido' }), auth),
    (error) => error.statusCode === 401 && error.message === 'Token inválido ou expirado.',
  );
});
