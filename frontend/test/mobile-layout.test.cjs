const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('estilos mobile preservam ações, tabelas e abas nas telas financeiras', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'globals.css'), 'utf8');

  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /\.tbl \{ min-width: 640px/);
  assert.match(css, /\.modal \{ width: 100%/);
  assert.match(css, /\.inv-tabs \{ width: 100%/);
  assert.match(css, /\.report-pie-layout/);
  assert.match(css, /\.drawer \{ width: 100vw/);
  assert.match(css, /\.shell, \.main \{/);
  assert.match(css, /\.main \{ overflow-x: clip; \}/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /\.investment-portfolio-layout \{ grid-template-columns: minmax\(0, 1fr\) !important; \}/);
  assert.match(css, /\.investment-asset-metrics \{/);
  assert.match(css, /\.finance-list-table \{/);
  assert.match(css, /\.fixed-expenses-table td:nth-child\(4\)::before/);
});
