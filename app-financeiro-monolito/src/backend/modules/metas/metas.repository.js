/**
 * metas.repository.js — Queries do módulo Metas (Prisma/PostgreSQL).
 */
const { prisma } = require('../../config/database');

const MetasRepository = {
  async findAll() {
    return prisma.meta.findMany({ orderBy: { created_at: 'asc' } });
  },

  async findById(id) {
    return prisma.meta.findUnique({ where: { id } }) ?? undefined;
  },

  /**
   * Retorna a meta vinculada a um gasto variável.
   * @param {string} gastoVariavelId
   */
  async findByGastoVariavelId(gastoVariavelId) {
    return prisma.meta.findFirst({ where: { gasto_variavel_id: gastoVariavelId } }) ?? undefined;
  },

  /**
   * Incrementa (ou decrementa) o valor_atual de uma meta atomicamente.
   * Não permite que valor_atual fique negativo.
   * @param {string} id
   * @param {number} delta
   */
  async ajustarValorAtual(id, delta) {
    const meta = await prisma.meta.findUnique({ where: { id }, select: { valor_atual: true } });
    if (!meta) return;
    const novoValor = Math.max(0, meta.valor_atual + delta);
    await prisma.meta.update({ where: { id }, data: { valor_atual: novoValor } });
  },

  async create(dados) {
    const created = await prisma.meta.create({
      data: {
        titulo:      dados.titulo,
        descricao:   dados.descricao   ?? null,
        valor_alvo:  dados.valor_alvo  ?? 0,
        valor_atual: dados.valor_atual ?? 0,
        data_limite: dados.data_limite ?? null,
      },
    });
    return { id: created.id };
  },

  async update(id, dados) {
    const result = await prisma.meta.updateMany({
      where: { id },
      data: {
        titulo:             dados.titulo,
        descricao:          dados.descricao          ?? null,
        valor_alvo:         dados.valor_alvo,
        valor_atual:        dados.valor_atual,
        data_limite:        dados.data_limite         ?? null,
        gasto_variavel_id:  dados.gasto_variavel_id  ?? null,
        contribuicao_ativa: dados.contribuicao_ativa == 1 || String(dados.contribuicao_ativa) === '1' || dados.contribuicao_ativa === true,
      },
    });
    return result.count > 0;
  },

  /**
   * Vincula um gasto variável à meta e ativa a contribuição.
   * @param {string} id
   * @param {string} gastoVariavelId
   */
  async ativarContribuicao(id, gastoVariavelId) {
    const result = await prisma.meta.updateMany({
      where: { id },
      data:  { gasto_variavel_id: gastoVariavelId, contribuicao_ativa: true },
    });
    return result.count > 0;
  },

  /**
   * Desativa a contribuição e remove o vínculo com o gasto variável.
   * @param {string} id
   */
  async desativarContribuicao(id) {
    const result = await prisma.meta.updateMany({
      where: { id },
      data:  { gasto_variavel_id: null, contribuicao_ativa: false },
    });
    return result.count > 0;
  },

  async delete(id) {
    // Remove vínculo de gasto_variavel_id em outros registros antes de excluir
    await prisma.meta.updateMany({
      where: { gasto_variavel_id: id },
      data:  { gasto_variavel_id: null },
    });
    const result = await prisma.meta.deleteMany({ where: { id } });
    return result.count > 0;
  },
};

module.exports = { MetasRepository };
