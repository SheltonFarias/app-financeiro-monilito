/**
 * receitas.schema.js — Schemas Zod para Receitas.
 */
const { z } = require('zod');

const CATEGORIAS = ['Trabalho', 'Apartamento', 'Outros', 'Mãe'];
const SITUACOES  = ['Pendente', 'Recebido'];

/** Regex para validar data no formato YYYY-MM-DD */
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

const receitaSchema = z.object({
  categoria:   z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  descricao:   z.string().min(1, 'Descrição é obrigatória').max(200),
  valor:       z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser número' }).min(0),
  situacao:    z.enum(SITUACOES).optional().default('Pendente'),
  cartao:      z.string().optional().default('—'),
  mes:         z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
  // Campos de recorrência (espelho de gastosFixos.schema.js)
  recorrente:  z.number().int().optional().default(0), // mantido para compatibilidade
  mensal:      z.number().int().min(0).max(1).optional().default(0),
  data_inicio: z.string().regex(dataRegex, 'data_inicio deve ser YYYY-MM-DD').nullable().optional().default(null),
  data_fim:    z.string().regex(dataRegex, 'data_fim deve ser YYYY-MM-DD').nullable().optional().default(null),
  template_id: z.number().int().positive().nullable().optional().default(null),
});

const updateStatusSchema = z.object({
  situacao: z.enum(SITUACOES),
});

module.exports = { receitaSchema, updateStatusSchema };
