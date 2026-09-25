-- 012_cotacoes_persistencia.sql
-- Cria tabelas para persistência de cotações Brapi, histórico e controle de rate-limit mensal.
-- NUNCA altere este arquivo. Para mudanças futuras, crie 013_*.sql

-- ─── Tabela: cotacoes ──────────────────────────────────────────────────────────
-- Mantém o snapshot mais recente de cada ativo.
-- Serve como cache persistente: substitui o Map in-memory volátil.
CREATE TABLE IF NOT EXISTS cotacoes (
  symbol      TEXT    PRIMARY KEY,
  preco       REAL,
  var_dia     REAL,
  volume      INTEGER,
  market_cap  REAL,
  nome        TEXT,
  cotacao_em  TEXT,   -- timestamp da cotação fornecido pela Brapi (ISO 8601)
  salvo_em    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Tabela: historico_cotacoes ────────────────────────────────────────────────
-- Série histórica por ativo — evita re-consultar o mesmo período.
-- Política de retenção: 90 dias (deletados a cada inserção via lógica no repository).
CREATE TABLE IF NOT EXISTS historico_cotacoes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol      TEXT    NOT NULL,
  preco       REAL,
  var_dia     REAL,
  volume      INTEGER,
  market_cap  REAL,
  cotacao_em  TEXT,
  salvo_em    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hist_symbol_em ON historico_cotacoes(symbol, salvo_em);

-- ─── Tabela: controle_requisicoes ──────────────────────────────────────────────
-- Singleton (id = 1) que rastreia o total de requisições HTTP feitas à Brapi no mês corrente.
-- Resetado automaticamente pelo repository sempre que mes_ano_referencia != mês atual.
CREATE TABLE IF NOT EXISTS controle_requisicoes (
  id                  INTEGER PRIMARY KEY CHECK(id = 1),
  mes_ano_referencia  TEXT    NOT NULL,   -- formato "YYYY-MM"
  total_requisicoes   INTEGER NOT NULL DEFAULT 0,
  atualizado_em       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Garante que o registro singleton já exista ao aplicar a migration
INSERT OR IGNORE INTO controle_requisicoes (id, mes_ano_referencia, total_requisicoes)
VALUES (1, strftime('%Y-%m', 'now'), 0);
