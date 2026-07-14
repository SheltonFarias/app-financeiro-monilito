/**
 * receitas.schema.js — Schemas Zod para Receitas.
 */
const { z } = require('zod');

const CATEGORIAS = ['Trabalho', 'Apartamento', 'Outros', 'Mãe'];
const SITUACOES  = ['Pendente', 'Recebido'];

const receitaSchema = z.object({
  categoria:  z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  descricao:  z.string().min(1, 'Descrição é obrigatória').max(200),
  valor:      z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser número' }).min(0),
  situacao:   z.enum(SITUACOES).optional().default('Pendente'),
  cartao:     z.string().optional().default('—'),
  mes:        z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
  recorrente: z.number().int().optional().default(0),
});

const updateStatusSchema = z.object({
  situacao: z.enum(SITUACOES),
});

module.exports = { receitaSchema, updateStatusSchema };
