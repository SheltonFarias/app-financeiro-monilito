/**
 * metas.schema.js — Schemas Zod para Metas de Economia.
 */
const { z } = require('zod');

const metaSchema = z.object({
  titulo:       z.string().min(1, 'Título é obrigatório').max(100),
  descricao:    z.string().optional().nullable(),
  valor_alvo:   z.number({ required_error: 'Valor alvo é obrigatório' }).min(0),
  valor_atual:  z.number().min(0).default(0).optional(),
  data_limite:  z.string().optional().nullable(),
});

module.exports = { metaSchema };
