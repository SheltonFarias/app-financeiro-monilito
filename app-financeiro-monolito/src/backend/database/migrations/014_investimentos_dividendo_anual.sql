-- migration 014: adiciona campo dividendo_anual à tabela investimentos
-- Usado para calcular Dividend Yield estimado (DY%) no hub de análise Investidor10.
-- Valor em R$ por ação/cota por ano (ex: 12.00 = R$ 12,00/cota/ano).
-- Campo opcional: NULL significa não informado.

ALTER TABLE investimentos ADD COLUMN dividendo_anual REAL DEFAULT NULL;
