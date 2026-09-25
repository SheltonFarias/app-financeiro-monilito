const fs = require('fs');
const path = require('path');

const files = [
  'src/pages_components/Receitas.jsx',
  'src/pages_components/Metas.jsx',
  'src/pages_components/GastosFixos.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace item.mensal === 1 with (item.mensal === 1 || item.mensal === true)
  content = content.replace(/item\.mensal === 1/g, "(item.mensal === 1 || item.mensal === true)");
  content = content.replace(/item\.recorrente === 1/g, "(item.recorrente === 1 || item.recorrente === true)");
  
  // Replace r.recorrente === 1 with (r.recorrente === 1 || r.recorrente === true)
  content = content.replace(/r\.recorrente === 1/g, "(r.recorrente === 1 || r.recorrente === true)");

  // Replace m.contribuicao_ativa === 1 with (m.contribuicao_ativa === 1 || m.contribuicao_ativa === true)
  content = content.replace(/m\.contribuicao_ativa === 1/g, "(m.contribuicao_ativa === 1 || m.contribuicao_ativa === true)");

  // Replace g.mensal === 1 with (g.mensal === 1 || g.mensal === true)
  content = content.replace(/g\.mensal === 1/g, "(g.mensal === 1 || g.mensal === true)");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}
