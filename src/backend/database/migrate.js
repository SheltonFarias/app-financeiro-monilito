/**
 * migrate.js — Runner de migrations do banco de dados.
 * Lê todos os arquivos .sql da pasta migrations/ em ordem numérica
 * e os executa uma única vez, controlando pelo nome do arquivo.
 */
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Garante que a tabela de controle de migrations existe.
 */
function criarTabelaMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Retorna os nomes das migrations já aplicadas.
 * @returns {Set<string>}
 */
function migrationJaAplicada(nome) {
  const row = db.prepare('SELECT id FROM _migrations WHERE nome = ?').get(nome);
  return !!row;
}

/**
 * Registra uma migration como aplicada.
 * @param {string} nome
 */
function registrarMigration(nome) {
  db.prepare('INSERT INTO _migrations (nome) VALUES (?)').run(nome);
}

/**
 * Executa todas as migrations pendentes em ordem numérica.
 */
function runMigrations() {
  criarTabelaMigrations();

  const arquivos = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Garante ordem: 001_, 002_, etc.

  for (const arquivo of arquivos) {
    if (migrationJaAplicada(arquivo)) {
      console.log(`  ⏭  Migration já aplicada: ${arquivo}`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, arquivo);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    try {
      db.exec(sql);
      registrarMigration(arquivo);
      console.log(`  ✅ Migration aplicada: ${arquivo}`);
    } catch (err) {
      console.error(`  ❌ Erro ao aplicar migration ${arquivo}:`, err.message);
      process.exit(1);
    }
  }

  console.log('📦 Migrations concluídas.');
}

// Permite executar diretamente: node src/database/migrate.js
if (require.main === module) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
  runMigrations();
}

module.exports = { runMigrations };
