/**
 * receitas.repository.js — Queries SQL do módulo Receitas.
 */
const { db } = require('../../config/database');

/**
 * @typedef {Object} Receita
 * @property {number} id
 * @property {string} categoria
 * @property {string} descricao
 * @property {number} valor
 * @property {string} situacao
 * @property {string|null} cartao
 * @property {string} mes
 * @property {number} recorrente
 * @property {string} created_at
 * @property {string} updated_at
 */

const ReceitasRepository = {
  /**
   * Busca todas as receitas de um mês.
   * @param {string} mes
   * @returns {Receita[]}
   */
  findByMes(mes) {
    return db
      .prepare('SELECT * FROM receitas WHERE mes = ? ORDER BY id ASC')
      .all(mes);
  },

  /**
   * Busca todas as receitas (para evolução mensal).
   * @returns {Receita[]}
   */
  findAll() {
    return db
      .prepare('SELECT * FROM receitas ORDER BY mes ASC, id ASC')
      .all();
  },

  /**
   * Busca uma receita pelo ID.
   * @param {number} id
   * @returns {Receita | undefined}
   */
  findById(id) {
    return db
      .prepare('SELECT * FROM receitas WHERE id = ?')
      .get(id);
  },

  /**
   * Busca receitas recorrentes de um mês de origem que ainda NÃO existem no mês destino.
   * (Depreciado/Mantido para compatibilidade, o service agora usa findAllRecorrentes)
   */
  findRecorrentesParaPropagar(mesOrigem, mesDestino) {
    return db.prepare(`
      SELECT r.*
      FROM receitas r
      WHERE r.mes = ?
        AND r.recorrente = 1
        AND NOT EXISTS (
          SELECT 1 FROM receitas d
          WHERE d.mes = ?
            AND d.descricao = r.descricao
            AND d.categoria = r.categoria
            AND d.recorrente = 1
        )
    `).all(mesOrigem, mesDestino);
  },

  /**
   * Retorna TODAS as receitas marcadas como recorrentes no banco.
   * Usado para mapear o histórico e preencher lacunas de meses pulados.
   * @returns {Receita[]}
   */
  findAllRecorrentes() {
    return db.prepare('SELECT * FROM receitas WHERE recorrente = 1').all();
  },

  /**
   * Verifica se já existe uma receita recorrente exatamente igual num determinado mês.
   * Evita duplicidade ao propagar lacunas.
   */
  existeIgual(mes, categoria, descricao, cartao) {
    const row = db.prepare(`
      SELECT 1 FROM receitas
      WHERE mes = ? AND categoria = ? AND descricao = ? AND cartao = ? AND recorrente = 1
      LIMIT 1
    `).get(mes, categoria, descricao, cartao);
    return !!row;
  },

  /**
   * Insere uma nova receita.
   * @param {Omit<Receita, 'id'|'created_at'|'updated_at'>} dados
   * @returns {{ id: number }}
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO receitas (categoria, descricao, valor, situacao, cartao, mes, recorrente)
      VALUES (@categoria, @descricao, @valor, @situacao, @cartao, @mes, @recorrente)
    `);
    const result = stmt.run(dados);
    return { id: result.lastInsertRowid };
  },

  /**
   * Atualiza todos os campos de uma receita.
   * @param {number} id
   * @param {Omit<Receita, 'id'|'created_at'|'updated_at'>} dados
   * @returns {boolean}
   */
  update(id, dados) {
    const result = db.prepare(`
      UPDATE receitas
      SET categoria = @categoria, descricao = @descricao, valor = @valor,
          situacao = @situacao, cartao = @cartao, mes = @mes, recorrente = @recorrente
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
      .prepare('UPDATE receitas SET situacao = ? WHERE id = ?')
      .run(situacao, id);
    return result.changes > 0;
  },

  /**
   * Remove uma receita pelo ID.
   * @param {number} id
   * @returns {boolean}
   */
  delete(id) {
    const result = db
      .prepare('DELETE FROM receitas WHERE id = ?')
      .run(id);
    return result.changes > 0;
  },
};

module.exports = { ReceitasRepository };
