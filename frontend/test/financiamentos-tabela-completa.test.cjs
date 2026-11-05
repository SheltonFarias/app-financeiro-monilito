const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('tabela de financiamento pagina as parcelas e informa o total projetado', () => {
  const tela = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'pages_components', 'Financiamentos.jsx'),
    'utf8',
  );

  assert.match(tela, /const \[itensPorPagina, setItensPorPagina\] = useState\(15\)/);
  assert.match(tela, /<option value=\{15\}>15<\/option>/);
  assert.match(tela, /<option value=\{50\}>50<\/option>/);
  assert.match(tela, /<option value=\{100\}>100<\/option>/);
  assert.match(tela, /const parcelasVisiveis = tabela\.slice\(inicioTabela, inicioTabela \+ itensPorPagina\)/);
  assert.match(tela, /parcelasVisiveis\.map\(\(linha\)/);
  assert.match(tela, /Mostrando \{tabela\.length \? inicioTabela \+ 1 : 0\}/);
});
