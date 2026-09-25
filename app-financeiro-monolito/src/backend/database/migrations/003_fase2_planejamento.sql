-- 003_fase2_planejamento.sql

PRAGMA foreign_keys = ON;

-- ─── Metas ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo       TEXT    NOT NULL,
  descricao    TEXT,
  valor_alvo   REAL    NOT NULL CHECK(valor_alvo >= 0),
  valor_atual  REAL    NOT NULL DEFAULT 0 CHECK(valor_atual >= 0),
  data_limite  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS metas_updated_at
  AFTER UPDATE ON metas
  BEGIN
    UPDATE metas SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

-- ─── Cartões de Crédito ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cartoes_credito (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nome           TEXT    NOT NULL UNIQUE,
  limite_total   REAL    NOT NULL CHECK(limite_total >= 0),
  dia_fechamento INTEGER NOT NULL,
  dia_vencimento INTEGER NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS cartoes_credito_updated_at
  AFTER UPDATE ON cartoes_credito
  BEGIN
    UPDATE cartoes_credito SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

-- ─── Parcelas ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcelas (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  gasto_id       INTEGER NOT NULL,
  numero_parcela INTEGER NOT NULL,
  total_parcelas INTEGER NOT NULL,
  valor_parcela  REAL    NOT NULL,
  mes            TEXT    NOT NULL,
  FOREIGN KEY (gasto_id) REFERENCES gastos_variaveis(id) ON DELETE CASCADE
);

-- ─── Alterações em Gastos Variáveis (Subcategorias, Recorrente) ───────
ALTER TABLE gastos_variaveis ADD COLUMN subcategoria TEXT;
ALTER TABLE gastos_variaveis ADD COLUMN recorrente INTEGER DEFAULT 0;
ALTER TABLE gastos_variaveis ADD COLUMN frequencia TEXT DEFAULT 'mensal';
ALTER TABLE gastos_variaveis ADD COLUMN tags TEXT;

-- ─── Tabela de Tags (cadastro) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  nome  TEXT NOT NULL UNIQUE,
  cor   TEXT NOT NULL DEFAULT '#8fa3b8'
);
