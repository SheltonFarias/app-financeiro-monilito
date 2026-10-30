const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('dashboard evita percentuais enganosos sem receita e destaca alertas de fluxo', () => {
  const dashboard = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'pages_components', 'VisaoGeral.jsx'),
    'utf8',
  );

  assert.match(dashboard, /receita não registrada/);
  assert.match(dashboard, /Resultado do Mês/);
  assert.match(dashboard, /alertaPrincipal/);
  assert.match(dashboard, /orcamentosCriticos/);
  assert.match(dashboard, /registre mais meses para analisar tendências/);
});
