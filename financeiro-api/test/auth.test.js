import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { AuthError, login } from '../src/modules/auth/service.js';

const authConfig = {
  passwordHash: await bcrypt.hash('senha-de-teste', 4),
  jwtSecret: 'segredo-de-teste-com-tamanho-suficiente',
  jwtExpiresIn: '8h',
  username: 'financeiro',
};

test('emite JWT compatível após autenticação válida', async () => {
  const result = await login('senha-de-teste', authConfig);
  const { payload, protectedHeader } = await jwtVerify(
    result.token,
    new TextEncoder().encode(authConfig.jwtSecret),
  );

  assert.equal(protectedHeader.alg, 'HS256');
  assert.equal(payload.authenticated, true);
  assert.equal(payload.username, 'financeiro');
  assert.deepEqual(Object.keys(result).sort(), ['expiresIn', 'token', 'username']);
});

test('rejeita senha inválida mantendo o erro de autenticação', async () => {
  await assert.rejects(
    () => login('senha-incorreta', authConfig),
    (error) => error instanceof AuthError && error.statusCode === 401 && error.message === 'Senha incorreta.',
  );
});
