import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('adaptador da Vercel exporta um handler HTTP sem iniciar listener', async () => {
  const modulo = await import('../api/[...path].js');

  assert.equal(typeof modulo.default, 'function');
});

test('gera o cliente Prisma durante a instalação para o deploy na Vercel', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(packageJson.scripts.postinstall, 'npm run prisma:generate');
});

test('configura migrações Prisma no build da Vercel', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  );

  assert.equal(packageJson.scripts['prisma:migrate'], 'prisma migrate deploy --schema prisma/schema.prisma');
  assert.equal(packageJson.scripts['vercel-build'], 'npm run prisma:generate && npm run prisma:migrate');
});
