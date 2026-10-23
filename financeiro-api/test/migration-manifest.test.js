import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { routeMigrationManifest } from '../src/migration-manifest.js';

const VALID_STATUSES = new Set(['native', 'native-when-configured']);

test('todo endpoint legado tem estado de migração explícito', () => {
  assert.ok(routeMigrationManifest.length >= 40, 'O inventário deve conter toda a superfície da API.');
  const keys = routeMigrationManifest.flatMap((route) => route.methods.map((method) => `${method} ${route.path}`));

  assert.equal(new Set(keys).size, keys.length, 'Não pode haver método/caminho duplicado no inventário.');
  for (const route of routeMigrationManifest) {
    assert.ok(VALID_STATUSES.has(route.status), `Estado inválido em ${route.path}.`);
    assert.ok(route.path.startsWith('/api/'), `Caminho inválido em ${route.path}.`);
    assert.ok(route.methods.length > 0, `Método ausente em ${route.path}.`);
  }
  assert.equal(routeMigrationManifest.some((route) => route.status === 'proxy'), false, 'A API separada não pode manter fallback para o monólito.');
});

test('rota nativa declara seu teste de migração', async () => {
  const nativeRoutes = routeMigrationManifest.filter((route) => route.status.startsWith('native'));
  assert.ok(nativeRoutes.length > 0, 'Ao menos uma rota deve validar o fluxo nativo.');

  await Promise.all(nativeRoutes.map(async (route) => {
    assert.ok(route.testFile, `Rota nativa sem teste declarado: ${route.path}`);
    await access(new URL(`../${route.testFile}`, import.meta.url), constants.F_OK);
  }));
});
