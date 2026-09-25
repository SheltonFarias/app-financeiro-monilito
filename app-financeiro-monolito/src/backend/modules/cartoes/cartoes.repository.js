/**
 * cartoes.repository.js — Queries do módulo Cartões de Crédito (Prisma/PostgreSQL).
 */
const { prisma } = require('../../config/database');

const CartoesRepository = {
  async findAll() {
    return prisma.cartaoCredito.findMany({ orderBy: { created_at: 'asc' } });
  },

  async findById(id) {
    return prisma.cartaoCredito.findUnique({ where: { id } }) ?? undefined;
  },

  async create(dados) {
    const created = await prisma.cartaoCredito.create({
      data: {
        nome:           dados.nome,
        limite_total:   dados.limite_total,
        dia_fechamento: dados.dia_fechamento,
        dia_vencimento: dados.dia_vencimento,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.cartaoCredito.updateMany({
      where: { id },
      data: {
        nome:           dados.nome,
        limite_total:   dados.limite_total,
        dia_fechamento: dados.dia_fechamento,
        dia_vencimento: dados.dia_vencimento,
      },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.cartaoCredito.deleteMany({ where: { id } });
    return result.count > 0;
  },
};

module.exports = { CartoesRepository };

