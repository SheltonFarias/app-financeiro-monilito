-- 002_orcamentos_mensais.sql

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS orcamentos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria    TEXT    NOT NULL CHECK(categoria IN ('Casa','Alimentação','Transporte','Lazer','Saúde','Vestuário','Outros','Mãe')),
  valor_limite REAL    NOT NULL CHECK(valor_limite >= 0),
  mes          TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(categoria, mes)
);

CREATE TRIGGER IF NOT EXISTS orcamentos_updated_at
  AFTER UPDATE ON orcamentos
  BEGIN
    UPDATE orcamentos SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE INDEX IF NOT EXISTS idx_orcamentos_mes ON orcamentos(mes);
