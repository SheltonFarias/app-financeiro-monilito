/**
 * gastosVariaveis.repository.js — Queries SQL do módulo Gastos Variáveis.
 */
const { db } = require('../../config/database');

/**
 * @typedef {Object} GastoVariavel
 * @property {number} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string|null} parcela
 * @property {string|null} data_compra
 * @property {string} pagamento
 * @property {string} situacao
 * @property {string} mes
 * @property {string} created_at
 * @property {string} updated_at
 */

const GastosVariaveisRepository = {
  /**
   * Busca todos os gastos variáveis de um mês.
   * @param {string} mes
   * @returns {GastoVariavel[]}
   */
  findByMes(mes) {
    return db
      .prepare('SELECT * FROM gastos_variaveis WHERE mes = ? ORDER BY id ASC')
      .all(mes);
  },

  /**
   * Busca todos os gastos variáveis (para evolução mensal).
   * @returns {GastoVariavel[]}
   */
  findAll() {
    return db
      .prepare('SELECT * FROM gastos_variaveis ORDER BY mes ASC, id ASC')
      .all();
  },

  /**
   * Busca um gasto variável pelo ID.
   * @param {number} id
   * @returns {GastoVariavel | undefined}
   */
  findById(id) {
    return db
      .prepare('SELECT * FROM gastos_variaveis WHERE id = ?')
      .get(id);
  },

  /**
   * Insere um novo gasto variável.
   * @param {Omit<GastoVariavel, 'id'|'created_at'|'updated_at'>} dados
   * @returns {{ id: number }}
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO gastos_variaveis (categoria, descricao, valor, parcela, data_compra, pagamento, situacao, mes, subcategoria, recorrente, frequencia, tags)
      VALUES (@categoria, @descricao, @valor, @parcela, @data_compra, @pagamento, @situacao, @mes, @subcategoria, @recorrente, @frequencia, @tags)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  /**
   * Atualiza todos os campos de um gasto variável.
   * @param {number} id
   * @param {Omit<GastoVariavel, 'id'|'created_at'|'updated_at'>} dados
   * @returns {boolean}
   */
  update(id, dados) {
    const result = db.prepare(`
      UPDATE gastos_variaveis
      SET categoria = @categoria, descricao = @descricao, valor = @valor,
          parcela = @parcela, data_compra = @data_compra, pagamento = @pagamento,
          situacao = @situacao, mes = @mes, subcategoria = @subcategoria,
          recorrente = @recorrente, frequencia = @frequencia, tags = @tags
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  /**
   * Atualiza apenas o campo situacao.
   * @param {number} id
   * @param {string} situacao
   * @returns {boolean}
   */
  updateStatus(id, situacao) {
    const result = db
      .prepare('UPDATE gastos_variaveis SET situacao = ? WHERE id = ?')
      .run(situacao, id);
    return result.changes > 0;
  },

  /**
   * Remove um gasto variável pelo ID.
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db
      .prepare('DELETE FROM gastos_variaveis WHERE id = ?')
      .run(id);
    return result.changes > 0;
  },
};

module.exports = { GastosVariaveisRepository };
