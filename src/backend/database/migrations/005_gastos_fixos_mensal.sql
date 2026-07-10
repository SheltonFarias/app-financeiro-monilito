-- 005_gastos_fixos_mensal.sql
-- Adiciona flag `mensal` para gastos fixos que devem aparecer em TODOS os meses,
-- sem necessidade de definir data_fim.
-- mensal = 1 → propaga para todos os meses a partir de data_inicio (ou indefinidamente)
-- mensal = 0 → comportamento padrão (avulso ou com data_fim)
-- NUNCA altere este arquivo. Para mudanças futuras, crie 006_*.sql

PRAGMA foreign_keys = ON;

ALTER TABLE gastos_fixos ADD COLUMN mensal INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_gastos_fixos_mensal ON gastos_fixos(mensal);
