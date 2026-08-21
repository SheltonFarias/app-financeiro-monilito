/**
 * orcamentos.repository.js — Queries do módulo Orçamentos (Prisma/PostgreSQL).
 */
const { prisma } = require('../../config/database');

const OrcamentosRepository = {
  /** @param {string} mes */
  async findByMes(mes) {
    return prisma.orcamento.findMany({
      where:   { mes },
      orderBy: { created_at: 'asc' },
    });
  },

  async findAll() {
    return prisma.orcamento.findMany({ orderBy: [{ mes: 'asc' }, { created_at: 'asc' }] });
  },

  async findById(id) {
    return prisma.orcamento.findUnique({ where: { id } }) ?? undefined;
  },

  async findByCategoriaAndMes(categoria, mes) {
    return prisma.orcamento.findFirst({ where: { categoria, mes } }) ?? undefined;
  },

  async create(dados) {
    const created = await prisma.orcamento.create({
      data: {
        categoria:    dados.categoria,
        valor_limite: dados.valor_limite,
        mes:          dados.mes,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.orcamento.updateMany({
      where: { id },
      data: {
        categoria:    dados.categoria,
        valor_limite: dados.valor_limite,
        mes:          dados.mes,
      },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.orcamento.deleteMany({ where: { id } });
    return result.count > 0;
  },
};

module.exports = { OrcamentosRepository };
