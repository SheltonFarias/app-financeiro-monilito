const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8');

test('lançamentos recorrentes podem ser encerrados a partir do mês atual', () => {
  const api = read('utils/apiService.js');
  assert.match(api, /deleteReceitaDaquiEmDiante/);
  assert.match(api, /deleteGastoFixoDaquiEmDiante/);
  assert.match(api, /deleteGastoVariavelDaquiEmDiante/);
  assert.match(api, /\/daqui-em-diante/);

  for (const component of ['pages_components/Receitas.jsx', 'pages_components/GastosFixos.jsx', 'pages_components/GastosVariaveis.jsx']) {
    const source = read(component);
    assert.match(source, /Excluir deste mês em diante/);
    assert.match(source, /handleDeleteDaquiEmDiante/);
  }
});
