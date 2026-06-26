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

/** Schema para criação e edição de gasto fixo */
const gastoFixoSchema = z.object({
  categoria:  z.enum(CATEGORIAS, { message: `Categoria deve ser um de: ${CATEGORIAS.join(', ')}` }),
  descricao:  z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
  valor:      z.number({ required_error: 'Valor é obrigatório', invalid_type_error: 'Valor deve ser um número' }).min(0, 'Valor não pode ser negativo'),
  vencimento: z.string().optional().default(''),
  cartao:     z.string().optional().default('—'),
  situacao:   z.enum(SITUACOES, { message: 'Situação deve ser Pendente ou Pago' }).optional().default('Pendente'),
  mes:        z.string().regex(/^[A-Za-zÀ-ú]+\d{4}$/, 'Mês deve estar no formato "Junho2026"'),
});

/** Schema para atualização parcial de situação */
const updateStatusSchema = z.object({
  situacao: z.enum(SITUACOES, { message: 'Situação deve ser Pendente ou Pago' }),
});

module.exports = { gastoFixoSchema, updateStatusSchema };
