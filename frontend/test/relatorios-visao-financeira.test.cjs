const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('relatórios apresentam indicadores, cenários e prioridades de fluxo de caixa', () => {
  const relatorios = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'pages_components', 'Relatorios.jsx'),
    'utf8',
  );

  assert.match(relatorios, /Taxa de poupança/);
  assert.match(relatorios, /Comprometimento fixo/);
  assert.match(relatorios, /Cenário conservador/);
  assert.match(relatorios, /Cenário otimista/);
  assert.match(relatorios, /Prioridades sugeridas/);
});
