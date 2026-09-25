/**
 * gastosVariaveis.repository.js — Queries do módulo Gastos Variáveis (Prisma/PostgreSQL).
 * IDs são agora UUID (String).
 */
const { prisma } = require('../../config/database');

/**
 * @typedef {Object} GastoVariavel
 * @property {string} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string|null} parcela
 * @property {string|null} data_compra
 * @property {string} pagamento
 * @property {string} situacao
 * @property {string} mes
 * @property {boolean} recorrente
 * @property {string|null} grupo_id
 */

const GastosVariaveisRepository = {
  async findByMes(mes) {
    return prisma.gastoVariavel.findMany({
      where:   { mes },
      orderBy: { created_at: 'asc' },
    });
  },

  async findAll() {
    return prisma.gastoVariavel.findMany({
      orderBy: [{ mes: 'asc' }, { created_at: 'asc' }],
    });
  },

  async findById(id) {
    return prisma.gastoVariavel.findUnique({ where: { id } }) ?? undefined;
  },

  async create(dados) {
    const created = await prisma.gastoVariavel.create({
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        data_compra: dados.data_compra ?? null,
        pagamento:   dados.pagamento,
        situacao:    dados.situacao    ?? 'Pendente',
        mes:         dados.mes,
        recorrente:  dados.recorrente == 1 || String(dados.recorrente) === '1' || dados.recorrente === true,
        grupo_id:    dados.grupo_id    ?? null,
      },
    });
    return { id: created.id };
  },

  async findByGrupoId(grupoId) {
    return prisma.gastoVariavel.findMany({
      where:   { grupo_id: grupoId },
      orderBy: [{ mes: 'asc' }, { created_at: 'asc' }],
    });
  },

  async deleteByGrupoId(grupoId) {
    const result = await prisma.gastoVariavel.deleteMany({ where: { grupo_id: grupoId } });
    return result.count;
  },

  async update(id, dados) {
    const result = await prisma.gastoVariavel.updateMany({
      where: { id },
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        data_compra: dados.data_compra ?? null,
        pagamento:   dados.pagamento,
        situacao:    dados.situacao,
        mes:         dados.mes,
      },
    });
    return result.count > 0;
  },

  async updateStatus(id, situacao) {
    const result = await prisma.gastoVariavel.updateMany({
      where: { id },
      data:  { situacao },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.gastoVariavel.deleteMany({ where: { id } });
    return result.count > 0;
  },
};

module.exports = { GastosVariaveisRepository };
