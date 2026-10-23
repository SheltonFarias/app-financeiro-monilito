import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('carrega configurações com valores seguros', () => {
  const config = loadConfig({
    PORT: '4010',
    CORS_ORIGINS: 'https://web.exemplo.com, https://app.exemplo.com ',
  });

  assert.equal(config.port, 4010);
  assert.equal(config.corsOrigins.has('https://app.exemplo.com'), true);
});
