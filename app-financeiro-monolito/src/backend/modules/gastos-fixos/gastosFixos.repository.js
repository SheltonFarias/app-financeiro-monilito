/**
 * gastosFixos.repository.js — Queries do módulo Gastos Fixos (Prisma/PostgreSQL).
 * IDs são agora UUID (String).
 */
const { prisma } = require('../../config/database');

/**
 * @typedef {Object} GastoFixo
 * @property {string} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string|null} vencimento
 * @property {string|null} cartao
 * @property {string} situacao
 * @property {string} mes
 * @property {boolean} mensal
 * @property {string|null} data_inicio
 * @property {string|null} data_fim
 * @property {string|null} template_id
 */

const GastosFixosRepository = {
  async findByMes(mes) {
    return prisma.gastoFixo.findMany({
      where:   { mes },
      orderBy: { created_at: 'asc' },
    });
  },

  async findAll() {
    return prisma.gastoFixo.findMany({
      orderBy: [{ mes: 'asc' }, { created_at: 'asc' }],
    });
  },

  async findById(id) {
    return prisma.gastoFixo.findUnique({ where: { id } }) ?? undefined;
  },

  /**
   * Busca templates de gastos recorrentes ativos em um determinado mês.
   * Estratégia em 2 etapas (sem subquery correlacionada):
   *   1. Busca IDs de templates que já têm cópia para o mês alvo.
   *   2. Busca templates que ainda não têm cópia para o mês.
   *
   * @param {string} primeiroDiaMes - "YYYY-MM-01"
   * @param {string} ultimoDiaMes   - "YYYY-MM-DD"
   * @param {string} mes            - "Julho2026"
   */
  async findTemplatesAtivos(primeiroDiaMes, ultimoDiaMes, mes) {
    // IDs de templates que já têm cópia no mês alvo
    const copias = await prisma.gastoFixo.findMany({
      where:  { template_id: { not: null }, mes },
      select: { template_id: true },
    });
    const idsJaCriados = copias.map(c => c.template_id).filter(Boolean);

    return prisma.gastoFixo.findMany({
      where: {
        template_id: null,
        mes:         { not: mes },
        OR: [
          { mensal: true },
          { data_fim: { not: null, gte: primeiroDiaMes } },
        ],
        AND: [
          { OR: [{ data_inicio: null }, { data_inicio: { lte: ultimoDiaMes } }] },
        ],
        ...(idsJaCriados.length > 0 ? { id: { notIn: idsJaCriados } } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
  },

  async create(dados) {
    const created = await prisma.gastoFixo.create({
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        vencimento:  dados.vencimento  ?? null,
        cartao:      dados.cartao      ?? null,
        situacao:    dados.situacao    ?? 'Pendente',
        mes:         dados.mes,
        mensal:      dados.mensal == 1 || String(dados.mensal) === '1' || dados.mensal === true,
        data_inicio: dados.data_inicio ?? null,
        data_fim:    dados.data_fim    ?? null,
        template_id: dados.template_id ?? null,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.gastoFixo.updateMany({
      where: { id },
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        vencimento:  dados.vencimento  ?? null,
        cartao:      dados.cartao      ?? null,
        situacao:    dados.situacao,
        mes:         dados.mes,
        mensal:      dados.mensal == 1 || String(dados.mensal) === '1' || dados.mensal === true,
        data_inicio: dados.data_inicio ?? null,
        data_fim:    dados.data_fim    ?? null,
      },
    });
    return result.count > 0;
  },

  async updateStatus(id, situacao) {
    const result = await prisma.gastoFixo.updateMany({
      where: { id },
      data:  { situacao },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.gastoFixo.deleteMany({ where: { id } });
    return result.count > 0;
  },

  /**
   * Remove o template e todas as suas cópias (ON DELETE CASCADE no schema).
   * @param {string} templateId
   */
  async deleteTemplate(templateId) {
    // O CASCADE do schema já remove as cópias, mas garantimos explicitamente
    await prisma.gastoFixo.deleteMany({ where: { template_id: templateId } });
    const result = await prisma.gastoFixo.deleteMany({ where: { id: templateId } });
    return result.count > 0;
  },
};

module.exports = { GastosFixosRepository };
