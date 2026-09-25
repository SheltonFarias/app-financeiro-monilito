const { prisma } = require('../../config/database');

const includeHistorico = {
  parcelas_pagas: { orderBy: { numero_parcela: 'desc' } },
  amortizacoes_extras: { orderBy: { parcela_referencia: 'asc' } },
};

const FinanciamentosRepository = {
  findAll() { return prisma.financiamento.findMany({ orderBy: { created_at: 'desc' } }); },
  findById(id) { return prisma.financiamento.findUnique({ where: { id }, include: includeHistorico }); },
  create(data) { return prisma.financiamento.create({ data }); },
  update(id, data) { return prisma.financiamento.update({ where: { id }, data }); },
  delete(id) { return prisma.financiamento.delete({ where: { id } }); },
  async createAmortizacao(financiamentoId, data) {
    return prisma.amortizacaoExtra.create({ data: { financiamento_id: financiamentoId, ...data } });
  },
  updateAmortizacao(id, data) { return prisma.amortizacaoExtra.update({ where: { id }, data }); },
  deleteAmortizacao(id) { return prisma.amortizacaoExtra.delete({ where: { id } }); },
  async createPagamento(financiamentoId, data) {
    return prisma.$transaction(async (tx) => {
      const financiamento = await tx.financiamento.findUnique({
        where: { id: financiamentoId },
        select: { parcela_atual: true },
      });
      const existente = await tx.parcelaPaga.findUnique({ where: { financiamento_id_numero_parcela: { financiamento_id: financiamentoId, numero_parcela: data.numero_parcela } } });
      if (existente) return null;
      const pagamento = await tx.parcelaPaga.create({ data: { financiamento_id: financiamentoId, ...data } });
      await tx.financiamento.update({
        where: { id: financiamentoId },
        data: { parcela_atual: Math.max(financiamento.parcela_atual, data.numero_parcela + 1) },
      });
      return pagamento;
    });
  },
  deletePagamento(id) { return prisma.parcelaPaga.delete({ where: { id } }); },
  findAmortizacao(id) { return prisma.amortizacaoExtra.findUnique({ where: { id } }); },
  findPagamento(id) { return prisma.parcelaPaga.findUnique({ where: { id } }); },
  findIndices(financiamentoId, serie) {
    return prisma.indiceBCBCache.findMany({
      where: { financiamento_id: financiamentoId, serie },
      orderBy: { competencia: 'asc' },
    });
  },
  upsertIndice(financiamentoId, serie, competencia, valor) {
    return prisma.indiceBCBCache.upsert({
      where: { financiamento_id_serie_competencia: { financiamento_id: financiamentoId, serie, competencia } },
      update: { valor },
      create: { financiamento_id: financiamentoId, serie, competencia, valor },
    });
  },
};

module.exports = { FinanciamentosRepository };
