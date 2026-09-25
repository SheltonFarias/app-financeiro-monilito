/**
 * receitas.repository.js — Queries do módulo Receitas (Prisma/PostgreSQL).
 * IDs são agora UUID (String).
 */
const { prisma } = require('../../config/database');

/**
 * @typedef {Object} Receita
 * @property {string} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string} situacao
 * @property {string|null} cartao
 * @property {string} mes
 * @property {boolean} recorrente
 * @property {boolean} mensal
 * @property {string|null} data_inicio
 * @property {string|null} data_fim
 * @property {string|null} template_id
 */

const ReceitasRepository = {
  async findByMes(mes) {
    return prisma.receita.findMany({
      where:   { mes },
      orderBy: { created_at: 'asc' },
    });
  },

  async findAll() {
    return prisma.receita.findMany({
      orderBy: [{ mes: 'asc' }, { created_at: 'asc' }],
    });
  },

  async findById(id) {
    return prisma.receita.findUnique({ where: { id } }) ?? undefined;
  },

  /**
   * Busca templates de receitas recorrentes ativos em um determinado mês.
   * Estratégia em 2 etapas (sem subquery correlacionada no Prisma).
   *
   * @param {string} primeiroDiaMes - "YYYY-MM-01"
   * @param {string} ultimoDiaMes   - "YYYY-MM-DD"
   * @param {string} mes            - "Julho2026"
   */
  async findTemplatesAtivos(primeiroDiaMes, ultimoDiaMes, mes) {
    const copias = await prisma.receita.findMany({
      where:  { template_id: { not: null }, mes },
      select: { template_id: true },
    });
    const idsJaCriados = copias.map(c => c.template_id).filter(Boolean);

    return prisma.receita.findMany({
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

  /**
   * Verifica se já existe receita igual num mês (evita duplicidade ao propagar).
   */
  async existeIgual(mes, categoria, descricao, cartao) {
    const row = await prisma.receita.findFirst({
      where: {
        mes,
        categoria,
        descricao,
        cartao,
        OR: [{ recorrente: true }, { mensal: true }, { data_fim: { not: null } }],
      },
    });
    return !!row;
  },

  async create(dados) {
    const created = await prisma.receita.create({
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        situacao:    dados.situacao    ?? 'Pendente',
        cartao:      dados.cartao      ?? null,
        mes:         dados.mes,
        recorrente:  dados.recorrente == 1 || String(dados.recorrente) === '1' || dados.recorrente === true,
        mensal:      dados.mensal == 1 || String(dados.mensal) === '1' || dados.mensal === true,
        data_inicio: dados.data_inicio ?? null,
        data_fim:    dados.data_fim    ?? null,
        template_id: dados.template_id ?? null,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.receita.updateMany({
      where: { id },
      data: {
        categoria:   dados.categoria,
        descricao:   dados.descricao,
        valor:       dados.valor,
        situacao:    dados.situacao,
        cartao:      dados.cartao      ?? null,
        mes:         dados.mes,
        recorrente:  dados.recorrente == 1 || String(dados.recorrente) === '1' || dados.recorrente === true,
        mensal:      dados.mensal == 1 || String(dados.mensal) === '1' || dados.mensal === true,
        data_inicio: dados.data_inicio ?? null,
        data_fim:    dados.data_fim    ?? null,
      },
    });
    return result.count > 0;
  },

  async updateStatus(id, situacao) {
    const result = await prisma.receita.updateMany({
      where: { id },
      data:  { situacao },
    });
    return result.count > 0;
  },

  async delete(id) {
    const result = await prisma.receita.deleteMany({ where: { id } });
    return result.count > 0;
  },

  async deleteTemplate(templateId) {
    await prisma.receita.deleteMany({ where: { template_id: templateId } });
    const result = await prisma.receita.deleteMany({ where: { id: templateId } });
    return result.count > 0;
  },
};

module.exports = { ReceitasRepository };
