import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('normaliza o escape de cifrão do hash bcrypt usado pelo monólito', () => {
  const config = loadConfig({
    AUTH_PASSWORD_HASH: '\\$2b\\$12\\$hash-compativel',
  });

  assert.equal(config.auth.passwordHash, '$2b$12$hash-compativel');
});
