/**
 * orcamentos.repository.js — Queries SQL do módulo Orçamentos.
 */
const { db } = require('../../config/database');

const OrcamentosRepository = {
  /**
   * Busca todos os orcamentos de um mês.
   * @param {string} mes
   */
  findByMes(mes) {
    return db
      .prepare('SELECT * FROM orcamentos WHERE mes = ? ORDER BY id ASC')
      .all(mes);
  },

  /**
   * Busca todos os orcamentos (para evolução mensal ou relatórios futuros).
   */
  findAll() {
    return db
      .prepare('SELECT * FROM orcamentos ORDER BY mes ASC, id ASC')
      .all();
  },

  /**
   * Busca um orcamento pelo ID.
   * @param {number} id
   */
  findById(id) {
    return db
      .prepare('SELECT * FROM orcamentos WHERE id = ?')
      .get(id);
  },

  /**
   * Busca orcamento por categoria e mês.
   */
  findByCategoriaAndMes(categoria, mes) {
    return db
      .prepare('SELECT * FROM orcamentos WHERE categoria = ? AND mes = ?')
      .get(categoria, mes);
  },

  /**
   * Insere um novo orcamento.
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO orcamentos (categoria, valor_limite, mes)
      VALUES (@categoria, @valor_limite, @mes)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  /**
   * Atualiza todos os campos de um orcamento.
   */
  update(id, dados) {
    const result = db.prepare(`
      UPDATE orcamentos
      SET categoria = @categoria, valor_limite = @valor_limite, mes = @mes
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  /**
   * Remove um orcamento pelo ID.
   */
  delete(id) {
    const result = db
      .prepare('DELETE FROM orcamentos WHERE id = ?')
      .run(id);
    return result.changes > 0;
  },
};

module.exports = { OrcamentosRepository };
