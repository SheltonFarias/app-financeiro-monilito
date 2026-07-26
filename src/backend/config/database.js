/**
 * database.js — Singleton de conexão com o banco de dados SQLite.
 * Importar este módulo sempre retorna a MESMA instância da conexão.
 * As migrations são executadas automaticamente ao inicializar.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(process.cwd(), 'data/financeiro.db');

// Garante que a pasta data/ existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

/** @type {import('better-sqlite3').Database} */
const db = new Database(DB_PATH);

// Otimizações de performance do SQLite
db.pragma('journal_mode = WAL');  // Write-Ahead Logging: melhor concorrência
db.pragma('foreign_keys = ON');   // Força integridade referencial

module.exports = { db };

// Executa migrations pendentes automaticamente ao inicializar
// (importado após module.exports para evitar dependência circular)
try {
  const { runMigrations } = require('../database/migrate');
  runMigrations();
} catch (err) {
  console.error('⚠️  Erro ao executar migrations automáticas:', err.message);
}
