const Database = require('better-sqlite3');
const db = new Database('data/financeiro.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log("Tables:", tables.map(t => t.name));

for (const t of tables) {
  if (t.name === 'sqlite_sequence') continue;
  console.log(`\n--- Schema of ${t.name} ---`);
  const columns = db.prepare(`PRAGMA table_info(${t.name});`).all();
  console.log(columns.map(c => `${c.name} (${c.type})`).join(', '));
}
