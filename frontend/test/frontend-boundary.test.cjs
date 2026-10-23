const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('o pacote web não declara dependências de backend', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const dependency of [
    '@prisma/client',
    '@prisma/adapter-pg',
    'bcryptjs',
    'dotenv',
    'jose',
    'jsonwebtoken',
    'pg',
    'prisma',
    'telegraf',
    'zod',
  ]) {
    assert.equal(dependencies[dependency], undefined, `${dependency} pertence à API, não ao web`);
  }
});

test('o adaptador web aponta chamadas para a API configurável', () => {
  const apiService = fs.readFileSync(path.join(root, 'src', 'utils', 'apiService.js'), 'utf8');

  assert.match(apiService, /NEXT_PUBLIC_API_URL/);
  assert.match(apiService, /http:\/\/localhost:3001/);
  assert.doesNotMatch(apiService, /src\/backend|@prisma|jsonwebtoken/);
});
