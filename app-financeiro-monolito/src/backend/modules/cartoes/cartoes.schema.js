/**
 * cartoes.schema.js — Schemas Zod para Cartões de Crédito.
 */
const { z } = require('zod');

const cartaoSchema = z.object({
  nome:           z.string().min(1, 'Nome é obrigatório').max(100),
  limite_total:   z.number({ required_error: 'Limite é obrigatório' }).min(0),
  dia_fechamento: z.number().int().min(1).max(31),
  dia_vencimento: z.number().int().min(1).max(31),
});

module.exports = { cartaoSchema };
