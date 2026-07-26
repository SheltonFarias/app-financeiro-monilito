-- 010_investimentos_rentabilidade.sql
-- Adiciona suporte a rentabilidade do CDI para ativos de Renda Fixa.
-- NUNCA altere este arquivo. Para mudanças futuras, crie 011_*.sql

ALTER TABLE investimentos ADD COLUMN rentabilidade_cdi REAL DEFAULT NULL;
