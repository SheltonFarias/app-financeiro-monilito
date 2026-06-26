/**
 * gastosFixos.repository.js — Queries SQL do módulo Gastos Fixos.
 * Responsável APENAS pelas operações no banco de dados.
 * Nunca lança exceções de negócio — retorna undefined quando não encontra.
 */
const { db } = require('../../config/database');

/**
 * @typedef {Object} GastoFixo
 * @property {number} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string|null} vencimento
 * @property {string|null} cartao
 * @property {string} situacao
 * @property {string} mes
 * @property {string} created_at
 * @property {string} updated_at
 */

const GastosFixosRepository = {
  /**
   * Busca todos os gastos fixos de um mês específico.
   * @param {string} mes - Ex: "Junho2026"
   * @returns {GastoFixo[]}
   */
  findByMes(mes) {
    return db
      .prepare('SELECT * FROM gastos_fixos WHERE mes = ? ORDER BY id ASC')
      .all(mes);
  },

  /**
   * Busca todos os gastos fixos de todos os meses (para evolução mensal).
   * @returns {GastoFixo[]}
   */
  findAll() {
    return db
      .prepare('SELECT * FROM gastos_fixos ORDER BY mes ASC, id ASC')
      .all();
  },

  /**
   * Busca um gasto fixo pelo ID.
   * @param {number} id
   * @returns {GastoFixo | undefined}
   */
  findById(id) {
    return db
      .prepare('SELECT * FROM gastos_fixos WHERE id = ?')
      .get(id);
  },

  /**
   * Insere um novo gasto fixo.
   * @param {Omit<GastoFixo, 'id'|'created_at'|'updated_at'>} dados
   * @returns {{ id: number }}
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO gastos_fixos (categoria, descricao, valor, vencimento, cartao, situacao, mes)
      VALUES (@categoria, @descricao, @valor, @vencimento, @cartao, @situacao, @mes)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  /**
   * Atualiza todos os campos de um gasto fixo por ID.
   * @param {number} id
   * @param {Omit<GastoFixo, 'id'|'created_at'|'updated_at'>} dados
   * @returns {boolean} true se atualizou, false se não encontrou
   */
  update(id, dados) {
    const result = db.prepare(`
      UPDATE gastos_fixos
      SET categoria = @categoria, descricao = @descricao, valor = @valor,
          vencimento = @vencimento, cartao = @cartao, situacao = @situacao, mes = @mes
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  /**
   * Atualiza apenas o campo situacao de um gasto fixo.
   * @param {number} id
   * @param {string} situacao
   * @returns {boolean}
   */
  updateStatus(id, situacao) {
    const result = db
      .prepare('UPDATE gastos_fixos SET situacao = ? WHERE id = ?')
      .run(situacao, id);
    return result.changes > 0;
  },

  /**
   * Remove um gasto fixo pelo ID.
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db
      .prepare('DELETE FROM gastos_fixos WHERE id = ?')
      .run(id);
    return result.changes > 0;
  },
};

module.exports = { GastosFixosRepository };
