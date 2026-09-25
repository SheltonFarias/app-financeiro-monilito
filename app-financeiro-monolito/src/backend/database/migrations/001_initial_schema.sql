-- 001_initial_schema.sql
-- Migration inicial: cria todas as tabelas, triggers e índices do Financeiro 2026.
-- NUNCA altere este arquivo. Para mudanças futuras, crie 002_*.sql

-- Habilita chaves estrangeiras
PRAGMA foreign_keys = ON;

-- ─── Tabela: gastos_fixos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos_fixos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria  TEXT    NOT NULL CHECK(categoria IN ('Educação','Veiculo','Casa','Apartamento','Lazer','Outros','Saúde','Mãe')),
  descricao  TEXT    NOT NULL,
  valor      REAL    NOT NULL CHECK(valor >= 0),
  vencimento TEXT,
  cartao     TEXT    DEFAULT '—',
  situacao   TEXT    NOT NULL DEFAULT 'Pendente' CHECK(situacao IN ('Pendente','Pago')),
  mes        TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Tabela: gastos_variaveis ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gastos_variaveis (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria   TEXT    NOT NULL CHECK(categoria IN ('Casa','Alimentação','Transporte','Lazer','Saúde','Vestuário','Outros','Mãe')),
  descricao   TEXT    NOT NULL,
  valor       REAL    NOT NULL CHECK(valor >= 0),
  parcela     TEXT,
  data_compra TEXT,
  pagamento   TEXT    NOT NULL CHECK(pagamento IN ('Cartão Inter','Cartão Nubank','Débito','Pix')),
  situacao    TEXT    NOT NULL DEFAULT 'Pendente' CHECK(situacao IN ('Pendente','Pago')),
  mes         TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Tabela: receitas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receitas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria  TEXT    NOT NULL CHECK(categoria IN ('Trabalho','Apartamento','Outros','Mãe')),
  descricao  TEXT    NOT NULL,
  valor      REAL    NOT NULL CHECK(valor >= 0),
  situacao   TEXT    NOT NULL DEFAULT 'Pendente' CHECK(situacao IN ('Pendente','Recebido')),
  cartao     TEXT    DEFAULT '—',
  mes        TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Tabela: investimentos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investimentos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker      TEXT    NOT NULL UNIQUE,
  tipo        TEXT    NOT NULL CHECK(tipo IN ('FII','Ação','ETF','Renda Fixa')),
  quantidade  INTEGER NOT NULL DEFAULT 0 CHECK(quantidade >= 0),
  preco_medio REAL    NOT NULL DEFAULT 0 CHECK(preco_medio >= 0),
  setor       TEXT,
  data_compra TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Triggers de updated_at ───────────────────────────────────────────────
CREATE TRIGGER IF NOT EXISTS gastos_fixos_updated_at
  AFTER UPDATE ON gastos_fixos
  BEGIN
    UPDATE gastos_fixos SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS gastos_variaveis_updated_at
  AFTER UPDATE ON gastos_variaveis
  BEGIN
    UPDATE gastos_variaveis SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS receitas_updated_at
  AFTER UPDATE ON receitas
  BEGIN
    UPDATE receitas SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS investimentos_updated_at
  AFTER UPDATE ON investimentos
  BEGIN
    UPDATE investimentos SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

-- ─── Índices para queries frequentes ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_gastos_fixos_mes     ON gastos_fixos(mes);
CREATE INDEX IF NOT EXISTS idx_gastos_variaveis_mes ON gastos_variaveis(mes);
CREATE INDEX IF NOT EXISTS idx_receitas_mes         ON receitas(mes);
