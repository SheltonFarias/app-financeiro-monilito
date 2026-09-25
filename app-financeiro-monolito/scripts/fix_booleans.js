const fs = require('fs');

const file = 'src/backend/modules/receitas/receitas.repository.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/recorrente:\s*dados\.recorrente\s*\?\?\s*false,/g, "recorrente:  dados.recorrente == 1 || String(dados.recorrente) === '1' || dados.recorrente === true,");
content = content.replace(/mensal:\s*dados\.mensal\s*\?\?\s*false,/g, "mensal:      dados.mensal == 1 || String(dados.mensal) === '1' || dados.mensal === true,");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed receitas.repository.js');
