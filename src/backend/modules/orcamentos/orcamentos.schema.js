/**
 * orcamentos.schema.js — Schemas Zod para Orçamentos.
 */
const { z } = require('zod');

const CATEGORIAS = ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Vestuário', 'Outros', 'Mãe'];

const orcamentoSchema = z.object({
  categoria:   z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  valor_limite: z.number({ required_error: 'Valor limite é obrigatório', invalid_type_error: 'Valor limite deve ser número' }).min(0),
  mes:         z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
});

module.exports = { orcamentoSchema };
