-- 006_receitas_recorrente.sql
-- Adiciona suporte a receitas recorrentes (salário, aluguel, etc.)
-- que se propagam automaticamente para meses futuros.

ALTER TABLE receitas ADD COLUMN recorrente INTEGER NOT NULL DEFAULT 0;
