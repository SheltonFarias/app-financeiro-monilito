const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const visaoGeralPath = path.join(__dirname, '..', 'src', 'pages_components', 'VisaoGeral.jsx');

test('visão geral exibe o resumo dos cartões vinculados', () => {
  const visaoGeral = fs.readFileSync(visaoGeralPath, 'utf8');

  assert.match(visaoGeral, /import\s+\{\s*calcularResumoCartoes\s*\}\s+from\s+["']\.\.\/utils\/cartoes["']/);
  assert.match(visaoGeral, /Resumo por Cartão/);
  assert.match(visaoGeral, /cartoes\.map\(/);
  assert.match(visaoGeral, /Nenhum cartão cadastrado/);
});
