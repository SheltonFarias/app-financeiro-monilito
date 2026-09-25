-- 008_receitas_recorrencia.sql
-- Refatora o suporte a recorrência de receitas:
-- Adiciona 'mensal' (permanente, sem data_fim) e 'data_fim' (recorrente até uma data).
-- A coluna 'recorrente' existente (006) é mantida para compatibilidade.

ALTER TABLE receitas ADD COLUMN mensal    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE receitas ADD COLUMN data_fim  TEXT;
ALTER TABLE receitas ADD COLUMN data_inicio TEXT;
ALTER TABLE receitas ADD COLUMN template_id INTEGER REFERENCES receitas(id);
