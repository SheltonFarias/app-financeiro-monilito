const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;

      // Add 'await ' before 'Service.' calls if not present
      // Match something like 'const data = DashboardService.carregarDados(mes);'
      const newContent1 = content.replace(/(?<!await\s+)([A-Z][a-zA-Z]+Service\.[a-zA-Z_0-9]+\()/g, 'await $1');
      if (newContent1 !== content) {
        content = newContent1;
        modified = true;
      }

      // Remove 'Number(id)' -> 'id' since IDs are now UUIDs
      const newContent2 = content.replace(/Number\((id)\)/g, '$1');
      if (newContent2 !== content) {
        content = newContent2;
        modified = true;
      }

      if (modified) {
        console.log('Fixed', fullPath);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}
processDir('src/app/api');
