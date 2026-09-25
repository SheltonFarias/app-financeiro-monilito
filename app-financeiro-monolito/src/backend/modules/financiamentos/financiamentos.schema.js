const { z } = require('zod');

const numero = (nome) => z.number({ required_error: `${nome} é obrigatório`, invalid_type_error: `${nome} deve ser um número` });

const financiamentoSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição é obrigatória').max(120),
  banco: z.string().trim().min(1, 'Banco é obrigatório').max(80),
  agencia: z.string().trim().max(30).nullable().optional().default(null),
  numeroContrato: z.string().trim().max(50).nullable().optional().default(null),
  programa: z.string().trim().max(80).nullable().optional().default(null),
  valorImovel: numero('Valor do imóvel').positive('Valor do imóvel deve ser maior que zero'),
  valorFinanciado: numero('Valor financiado').positive('Valor financiado deve ser maior que zero'),
  recursosProprios: z.number().min(0).optional().default(0),
  descontoFgts: z.number().min(0).optional().default(0),
  taxaJurosNominalAnual: numero('Taxa de juros').min(0).max(100),
  taxaEfetivaAnual: z.number().min(0).max(100).nullable().optional().default(null),
  sistemaAmort: z.enum(['PRICE', 'SAC']).default('PRICE'),
  indiceCorrecao: z.enum(['TR', 'IPCA', 'NENHUM']).default('TR'),
  prazoMeses: z.number().int().min(1).max(600),
  dataInicio: z.coerce.date(),
  parcelaAtual: z.number().int().min(1).optional().default(1),
  prestacaoInicialAj: numero('Prestação inicial').min(0),
  seguroMensal: z.number().min(0).optional().default(0),
  totalMensalInicial: numero('Total mensal inicial').min(0),
  tarifaAdministracao: z.number().min(0).optional().default(0),
  garantiaFiduciaria: z.number().min(0).nullable().optional().default(null),
});

const amortizacaoSchema = z.object({
  parcelaReferencia: z.number().int().min(1),
  dataPagamento: z.coerce.date(),
  valor: numero('Valor do aporte').positive('Valor do aporte deve ser maior que zero'),
  modalidade: z.enum(['REDUZ_PRAZO', 'REDUZ_PRESTACAO']),
  observacao: z.string().trim().max(500).nullable().optional().default(null),
});

const pagamentoSchema = z.object({
  numeroParcela: z.number().int().min(1),
  dataVencimento: z.coerce.date(),
  dataPagamentoReal: z.coerce.date().nullable().optional().default(null),
  valorPago: numero('Valor pago').positive('Valor pago deve ser maior que zero'),
  seguroPago: z.number().min(0).nullable().optional().default(null),
  observacao: z.string().trim().max(500).nullable().optional().default(null),
});

module.exports = { financiamentoSchema, amortizacaoSchema, pagamentoSchema };
