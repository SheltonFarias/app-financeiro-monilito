/**
 * cartoes.repository.js — Queries SQL do módulo Cartões de Crédito.
 */
const { db } = require('../../config/database');

const CartoesRepository = {
  findAll() {
    return db.prepare('SELECT * FROM cartoes_credito ORDER BY id ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM cartoes_credito WHERE id = ?').get(id);
  },

  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO cartoes_credito (nome, limite_total, dia_fechamento, dia_vencimento)
      VALUES (@nome, @limite_total, @dia_fechamento, @dia_vencimento)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  update(id, dados) {
    const result = db.prepare(`
      UPDATE cartoes_credito
      SET nome = @nome, limite_total = @limite_total, dia_fechamento = @dia_fechamento, dia_vencimento = @dia_vencimento
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  delete(id) {
    const result = db.prepare('DELETE FROM cartoes_credito WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = { CartoesRepository };
