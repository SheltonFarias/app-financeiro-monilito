/**
 * metas.repository.js — Queries SQL do módulo Metas.
 */
const { db } = require('../../config/database');

const MetasRepository = {
  findAll() {
    return db.prepare('SELECT * FROM metas ORDER BY id ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM metas WHERE id = ?').get(id);
  },

  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO metas (titulo, descricao, valor_alvo, valor_atual, data_limite)
      VALUES (@titulo, @descricao, @valor_alvo, @valor_atual, @data_limite)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  update(id, dados) {
    const result = db.prepare(`
      UPDATE metas
      SET titulo = @titulo, descricao = @descricao, valor_alvo = @valor_alvo, 
          valor_atual = @valor_atual, data_limite = @data_limite
      WHERE id = @id
    `).run({ ...dados, id });
    return result.changes > 0;
  },

  delete(id) {
    const result = db.prepare('DELETE FROM metas WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = { MetasRepository };
