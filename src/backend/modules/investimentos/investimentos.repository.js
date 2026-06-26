/**
 * investimentos.repository.js — Queries SQL do módulo Investimentos.
 */
const { db } = require('../../config/database');

/**
 * @typedef {Object} Investimento
 * @property {number} id
 * @property {string} ticker
 * @property {string} tipo
 * @property {number} quantidade
 * @property {number} preco_medio
 * @property {string|null} setor
 * @property {string|null} data_compra
 * @property {string} created_at
 * @property {string} updated_at
 */

const InvestimentosRepository = {
  /**
   * Busca todos os investimentos.
   * @returns {Investimento[]}
   */
  findAll() {
    return db
      .prepare('SELECT * FROM investimentos ORDER BY ticker ASC')
      .all();
  },

  /**
   * Busca um investimento pelo ID.
   * @param {number} id
   * @returns {Investimento | undefined}
   */
  findById(id) {
    return db
      .prepare('SELECT * FROM investimentos WHERE id = ?')
      .get(id);
  },

  /**
   * Busca um investimento pelo ticker.
   * @param {string} ticker
   * @returns {Investimento | undefined}
   */
  findByTicker(ticker) {
    return db
      .prepare('SELECT * FROM investimentos WHERE ticker = ?')
      .get(ticker);
  },

  /**
   * Insere um novo investimento.
   * @param {Omit<Investimento, 'id'|'created_at'|'updated_at'>} dados
   * @returns {{ id: number }}
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO investimentos (ticker, tipo, quantidade, preco_medio, setor, data_compra)
      VALUES (@ticker, @tipo, @quantidade, @preco_medio, @setor, @data_compra)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  /**
   * Atualiza todos os campos de um investimento.
   * @param {number} id
   * @param {Omit<Investimento, 'id'|'created_at'|'updated_at'>} dados
   * @returns {boolean}
   */
  update(id, dados) {
    const result = db.prepare(`
      UPDATE investimentos
      SET ticker = @ticker, tipo = @tipo, quantidade = @quantidade,
          preco_medio = @preco_medio, setor = @setor, data_compra = @data_compra
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  /**
   * Remove um investimento pelo ID.
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db
      .prepare('DELETE FROM investimentos WHERE id = ?')
      .run(id);
    return result.changes > 0;
  },
};

module.exports = { InvestimentosRepository };
