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
          valor_atual = @valor_atual, data_limite = @data_limite,
          gasto_variavel_id = @gasto_variavel_id, contribuicao_ativa = @contribuicao_ativa
      WHERE id = @id
    `).run({
      ...dados,
      gasto_variavel_id:  dados.gasto_variavel_id  ?? null,
      contribuicao_ativa: dados.contribuicao_ativa ?? 0,
      id,
    });
    return result.changes > 0;
  },

  /**
   * Vincula um gasto variável à meta e ativa a contribuição.
   * @param {number} id - ID da meta
   * @param {number} gastoVariavelId - ID do gasto variável criado
   */
  ativarContribuicao(id, gastoVariavelId) {
    const result = db.prepare(`
      UPDATE metas
      SET gasto_variavel_id = ?, contribuicao_ativa = 1
      WHERE id = ?
    `).run(gastoVariavelId, id);
    return result.changes > 0;
  },

  /**
   * Desativa a contribuição e remove o vínculo com o gasto variável.
   * @param {number} id - ID da meta
   */
  desativarContribuicao(id) {
    const result = db.prepare(`
      UPDATE metas
      SET gasto_variavel_id = NULL, contribuicao_ativa = 0
      WHERE id = ?
    `).run(id);
    return result.changes > 0;
  },

  delete(id) {
    const result = db.prepare('DELETE FROM metas WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

module.exports = { MetasRepository };
