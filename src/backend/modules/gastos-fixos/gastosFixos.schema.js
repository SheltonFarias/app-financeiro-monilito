/**
 * gastosFixos.schema.js — Schemas de validação Zod para Gastos Fixos.
 * Garante que os dados recebidos pelo controller estejam corretos
 * antes de chegar ao service/repository.
 */
const { z } = require('zod');

const CATEGORIAS = ['Educação', 'Veiculo', 'Casa', 'Apartamento', 'Lazer', 'Outros', 'Saúde', 'Mãe'];
const SITUACOES  = ['Pendente', 'Pago'];
// cartao é string livre: o frontend controla os valores via select
// (os valores contêm caracteres especiais — travessão e letras acentuadas)

/** Regex para validar data no formato YYYY-MM-DD */
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Schema para criação e edição de gasto fixo */
const gastoFixoSchema = z.object({
  categoria:   z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  descricao:   z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  valor:       z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser um número' }).min(0, 'Valor não pode ser negativo'),
  vencimento:  z.string().optional().default(''),
  cartao:      z.string().optional().default('—'),
  situacao:    z.enum(SITUACOES, { message: 'Situação deve ser Pendente ou Pago' }).optional().default('Pendente'),
  mes:         z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
  // Campos de recorrência (opcionais)
  // mensal = 1  → aparece em todos os meses (sem data_fim)
  // data_fim    → aparece até aquela data (mensal = 0)
  // ambos null  → gasto avulso só no mês selecionado
  mensal:      z.number().int().min(0).max(1).optional().default(0),
  data_inicio: z.string().regex(dataRegex, 'data_inicio deve ser YYYY-MM-DD').nullable().optional().default(null),
  data_fim:    z.string().regex(dataRegex, 'data_fim deve ser YYYY-MM-DD').nullable().optional().default(null),
  template_id: z.number().int().positive().nullable().optional().default(null),
});


/** Schema para atualização parcial de situação */
const updateStatusSchema = z.object({
  situacao: z.enum(SITUACOES, { message: 'Situação deve ser Pendente ou Pago' }),
});

module.exports = { gastoFixoSchema, updateStatusSchema };
