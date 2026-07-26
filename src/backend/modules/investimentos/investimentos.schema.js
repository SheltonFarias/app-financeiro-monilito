/**
 * investimentos.schema.js — Schemas Zod para Investimentos.
 */
const { z } = require('zod');

const TIPOS = ['FII', 'Ação', 'ETF', 'Renda Fixa'];

const investimentoSchema = z.object({
  ticker:           z.string().min(1, 'Ticker é obrigatório').max(20).toUpperCase(),
  tipo:             z.enum(TIPOS, { message: `Tipo deve ser um de: ${TIPOS.join(', ')}` }),
  quantidade:       z.number({ required_error: 'Quantidade é obrigatória', invalid_type_error: 'Quantidade deve ser número' }).int('Quantidade deve ser inteiro').min(0),
  precoMedio:       z.number({ required_error: 'Preço médio é obrigatório', invalid_type_error: 'Preço médio deve ser número' }).min(0),
  setor:            z.string().optional().nullable().default(null),
  dataCompra:       z.string().optional().nullable().default(null),
  rentabilidadeCdi: z.number().min(0).max(500).optional().nullable().default(null),
}).superRefine((data, ctx) => {
  // rentabilidadeCdi é obrigatório para Renda Fixa e ignorado nos demais tipos
  if (data.tipo === 'Renda Fixa' && (data.rentabilidadeCdi === null || data.rentabilidadeCdi === undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rentabilidadeCdi'],
      message: 'Rentabilidade (% do CDI) é obrigatória para Renda Fixa.',
    });
  }
  if (data.tipo !== 'Renda Fixa' && data.rentabilidadeCdi !== null && data.rentabilidadeCdi !== undefined) {
    // Silenciosamente limpa o campo para tipos não aplicáveis — não é um erro
    data.rentabilidadeCdi = null;
  }
});

module.exports = { investimentoSchema };
