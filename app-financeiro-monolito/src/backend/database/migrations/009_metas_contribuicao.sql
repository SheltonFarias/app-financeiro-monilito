-- 009_metas_contribuicao.sql
-- Adiciona suporte à contribuição mensal automática para metas de economia.
-- gasto_variavel_id: FK para o gasto variável criado automaticamente.
-- contribuicao_ativa: flag indicando se a contribuição está ativa (1) ou não (0).

ALTER TABLE metas ADD COLUMN gasto_variavel_id  INTEGER;
ALTER TABLE metas ADD COLUMN contribuicao_ativa INTEGER NOT NULL DEFAULT 0;
