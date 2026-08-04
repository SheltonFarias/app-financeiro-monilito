-- 011_gastos_variaveis_grupo.sql
-- Adiciona suporte a exclusão em série de parcelas de gastos variáveis.
-- grupo_id: identificador compartilhado entre todas as parcelas de uma mesma compra.
--           NULL = gasto avulso sem parcelas (compra à vista).
--           Qualquer valor = parcela de uma série. Todas as parcelas da mesma compra
--           compartilham o mesmo grupo_id para permitir exclusão em bloco.
-- NUNCA altere este arquivo. Para mudanças futuras, crie 012_*.sql

ALTER TABLE gastos_variaveis ADD COLUMN grupo_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gastos_variaveis_grupo_id ON gastos_variaveis(grupo_id);
