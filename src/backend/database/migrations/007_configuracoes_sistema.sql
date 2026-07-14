-- 007_configuracoes_sistema.sql
-- Adiciona tabela de chave-valor para configurações globais (Listas de Categorias, etc)

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Popula os dados iniciais do sistema
INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES 
('categorias_receitas', '["Trabalho","Apartamento","Outros","Mãe"]'),
('categorias_gastos_fixos', '["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"]'),
('categorias_gastos_variaveis', '["Educação","Veiculo","Casa","Apartamento","Lazer","Outros","Saúde","Mãe"]'),
('formas_pagamento', '["Cartão Inter","Cartão Nubank","Débito","Pix"]');
