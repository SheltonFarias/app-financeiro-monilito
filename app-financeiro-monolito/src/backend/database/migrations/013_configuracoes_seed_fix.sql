-- 013_configuracoes_seed_fix.sql
-- Corrige a tabela configuracoes que ficou vazia (INSERT OR IGNORE da 007 não populou os dados).
-- Usa INSERT OR REPLACE para garantir que os valores corretos sejam gravados.
-- NUNCA altere este arquivo. Para mudanças futuras, crie 014_*.sql

INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES
  ('categorias_receitas',       '["Trabalho","Apartamento","Outros","Mãe"]'),
  ('categorias_gastos_fixos',   '["Educação","Veiculo","Casa","Apartamento","Lazer","Outros","Saúde","Mãe"]'),
  ('categorias_gastos_variaveis','["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"]'),
  ('formas_pagamento',          '["Cartão Inter","Cartão Nubank","Débito","Pix"]');
