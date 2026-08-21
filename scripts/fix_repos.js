const fs = require('fs');

const filesToFix = [
  'src/backend/modules/receitas/receitas.repository.js',
  'src/backend/modules/orcamentos/orcamentos.repository.js',
  'src/backend/modules/metas/metas.repository.js',
  'src/backend/modules/investimentos/investimentos.repository.js',
  'src/backend/modules/gastos-variaveis/gastosVariaveis.repository.js',
  'src/backend/modules/gastos-fixos/gastosFixos.repository.js'
];

for (const file of filesToFix) {
  const content = fs.readFileSync(file, 'utf8');
  const exportMatch = content.match(/module\.exports\s*=\s*\{[^\}]+\};/);
  if (exportMatch) {
    const endIndex = exportMatch.index + exportMatch[0].length;
    const truncated = content.substring(0, endIndex) + '\n';
    fs.writeFileSync(file, truncated, 'utf8');
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Could not find export in ${file}`);
  }
}
