/**
 * gastosVariaveis.schema.js — Schemas Zod para Gastos Variáveis.
 */
const { z } = require('zod');

const CATEGORIAS = ['Casa', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Vestuário', 'Outros', 'Mãe'];
const PAGAMENTOS = ['Cartão Inter', 'Cartão Nubank', 'Débito', 'Pix'];
const SITUACOES  = ['Pendente', 'Pago'];

/** Schema para criação e edição */
const gastoVariavelSchema = z.object({
  categoria:   z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  descricao:   z.string().min(1, 'Descrição é obrigatória').max(200),
  valor:       z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser número' }).min(0),
  parcela:     z.string().optional().default(''),
  // dataCompra vindo do frontend (camelCase) — mapeado para data_compra no service
  dataCompra:  z.string().optional().nullable().default(null),
  pagamento:   z.enum(PAGAMENTOS, { message: `Pagamento deve ser um de: ${PAGAMENTOS.join(', ')}` }),
  situacao:    z.enum(SITUACOES).optional().default('Pendente'),
  mes:         z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
  subcategoria: z.string().optional().nullable(),
  recorrente:   z.number().int().optional().default(0),
  frequencia:   z.string().optional().default('mensal'),
  tags:         z.string().optional().nullable(),
  qtd_parcelas: z.number().int().min(1).optional().default(1),
});

/** Schema para atualização de situação */
const updateStatusSchema = z.object({
  situacao: z.enum(SITUACOES),
});

module.exports = { gastoVariavelSchema, updateStatusSchema };
