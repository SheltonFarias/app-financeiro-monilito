/**
 * investimentos.repository.js — Queries do módulo Investimentos (Prisma/PostgreSQL).
 */
const { prisma } = require('../../config/database');

/**
 * @typedef {Object} Investimento
 * @property {string} id
 * @property {string} ticker
 * @property {string} tipo
 * @property {number} quantidade
 * @property {number} preco_medio
 * @property {string|null} setor
 * @property {string|null} data_compra
 * @property {number|null} rentabilidade_cdi
 * @property {number|null} dividendo_anual
 */

const InvestimentosRepository = {
  async findAll() {
    return prisma.investimento.findMany({ orderBy: { ticker: 'asc' } });
  },

  async findById(id) {
    return prisma.investimento.findUnique({ where: { id } }) ?? undefined;
  },

  async findByTicker(ticker) {
    return prisma.investimento.findUnique({ where: { ticker } }) ?? undefined;
  },

  async create(dados) {
    const created = await prisma.investimento.create({
      data: {
        ticker:            dados.ticker,
        tipo:              dados.tipo,
        quantidade:        dados.quantidade        ?? 0,
        preco_medio:       dados.preco_medio       ?? 0,
        setor:             dados.setor             ?? null,
        data_compra:       dados.data_compra       ?? null,
        rentabilidade_cdi: dados.rentabilidade_cdi ?? null,
        dividendo_anual:   dados.dividendo_anual   ?? null,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.investimento.updateMany({
      where: { id },
      data: {
        ticker:            dados.ticker,
        tipo:              dados.tipo,
        quantidade:        dados.quantidade,
        preco_medio:       dados.preco_medio,
        setor:             dados.setor             ?? null,
        data_compra:       dados.data_compra       ?? null,
        rentabilidade_cdi: dados.rentabilidade_cdi ?? null,
        dividendo_anual:   dados.dividendo_anual   ?? null,
      },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.investimento.deleteMany({ where: { id } });
    return result.count > 0;
  },
};

module.exports = { InvestimentosRepository };
