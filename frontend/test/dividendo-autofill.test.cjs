const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('ticker digitado consulta os detalhes para preencher o dividendo anual', () => {
  const autocomplete = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'AutocompleteTicker.jsx'),
    'utf8',
  );

  assert.match(autocomplete, /dividendoAnual: details\?\.dividendoAnual \?\? 0/);
  assert.match(autocomplete, /onBlur=\{handleBlur\}/);
  assert.match(autocomplete, /setTimeout\(\(\) => buscarDetalhes\(tickerNormalizado\), 550\)/);
});
