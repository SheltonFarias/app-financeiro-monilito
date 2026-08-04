/**
 * limpar-banco.js — Remove todos os registros das tabelas e reseta os IDs.
 * Mantém a estrutura (schema, migrations) intacta.
 *
 * Uso: node scripts/limpar-banco.js
 */
require('dotenv').config();
const { db } = require('../src/backend/config/database');

const TABELAS = [
  'gastos_fixos',
  'gastos_variaveis',
  'receitas',
  'investimentos',
  'metas',
  'orcamentos_mensais',
  'cartoes',
  'configuracoes',
];

console.log('\n🗑️  Limpando banco de dados...\n');

// Desativa FK temporariamente para evitar conflitos de ordem
db.pragma('foreign_keys = OFF');

for (const tabela of TABELAS) {
  try {
    const info = db.prepare(`DELETE FROM ${tabela}`).run();
    console.log(`  ✅ ${tabela}: ${info.changes} registro(s) removido(s)`);
  } catch (err) {
    console.log(`  ⚠️  ${tabela}: ${err.message}`);
  }
}

// Reseta auto-increment de cada tabela
try {
  db.prepare(
    `DELETE FROM sqlite_sequence WHERE name IN (${TABELAS.map(() => '?').join(',')})`
  ).run(...TABELAS);
  console.log('\n  🔄 Auto-increment (IDs) resetado para todas as tabelas.');
} catch (e) {
  console.log(`\n  ⚠️  sqlite_sequence: ${e.message}`);
}

db.pragma('foreign_keys = ON');

console.log('\n✅ Banco limpo com sucesso! Pronto para dados reais.\n');
