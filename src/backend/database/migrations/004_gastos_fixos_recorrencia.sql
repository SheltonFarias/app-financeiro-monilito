-- 004_gastos_fixos_recorrencia.sql
-- Adiciona suporte a gastos fixos recorrentes com vigência definida (data_inicio / data_fim).
-- data_inicio : primeiro dia do mês em que o gasto começa (formato YYYY-MM-DD). NULL = sem restrição de início.
-- data_fim    : último dia do mês em que o gasto termina (formato YYYY-MM-DD). NULL = vigência indeterminada.
-- template_id : referência ao registro-template quando este registro é uma cópia auto-gerada para um mês.
--               NULL = o próprio registro é o template (ou gasto avulso sem recorrência).
-- NUNCA altere este arquivo. Para mudanças futuras, crie 005_*.sql

PRAGMA foreign_keys = ON;

ALTER TABLE gastos_fixos ADD COLUMN data_inicio TEXT;
ALTER TABLE gastos_fixos ADD COLUMN data_fim    TEXT;
ALTER TABLE gastos_fixos ADD COLUMN template_id INTEGER REFERENCES gastos_fixos(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_gastos_fixos_template_id ON gastos_fixos(template_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fixos_data_fim    ON gastos_fixos(data_fim);
