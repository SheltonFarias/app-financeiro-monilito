const { prisma } = require('../../config/database');

const ConfiguracoesRepository = {
  /**
   * Busca todas as configurações do banco.
   * @returns {Promise<Record<string, string>>}
   */
  async findAll() {
    const rows = await prisma.configuracao.findMany();
    const config = {};
    for (const row of rows) {
      config[row.chave] = row.valor;
    }
    return config;
  },

  /**
   * Busca uma configuração específica.
   * @param {string} chave
   * @returns {Promise<string|null>}
   */
  async findByChave(chave) {
    const row = await prisma.configuracao.findUnique({ where: { chave } });
    return row ? row.valor : null;
  },

  /**
   * Atualiza ou insere uma configuração.
   * @param {string} chave
   * @param {string} valor
   */
  async upsert(chave, valor) {
    await prisma.configuracao.upsert({
      where:  { chave },
      create: { chave, valor },
      update: { valor },
    });
  },
};

module.exports = { ConfiguracoesRepository };

