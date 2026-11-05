const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('menu não expõe o módulo Simulador de Aportes', () => {
  const pagina = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'page.js'), 'utf8');

  assert.doesNotMatch(pagina, /Simulador de Aportes/);
  assert.doesNotMatch(pagina, /SimuladorAportes/);
  assert.match(pagina, /label: "Aluguéis", key: 10/);
});
