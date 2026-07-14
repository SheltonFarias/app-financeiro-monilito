const { db } = require('../../config/database');

const ConfiguracoesRepository = {
  /**
   * Busca todas as configurações do banco.
   * @returns {Record<string, string>}
   */
  findAll() {
    const rows = db.prepare('SELECT chave, valor FROM configuracoes').all();
    const config = {};
    for (const row of rows) {
      config[row.chave] = row.valor;
    }
    return config;
  },

  /**
   * Busca uma configuração específica.
   * @param {string} chave 
   * @returns {string|null}
   */
  findByChave(chave) {
    const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave);
    return row ? row.valor : null;
  },

  /**
   * Atualiza ou insere uma configuração.
   * @param {string} chave 
   * @param {string} valor 
   */
  upsert(chave, valor) {
    db.prepare(`
      INSERT INTO configuracoes (chave, valor)
      VALUES (?, ?)
      ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP
    `).run(chave, valor);
  }
};

module.exports = { ConfiguracoesRepository };
