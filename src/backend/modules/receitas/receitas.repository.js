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
 * @property {number} recorrente      - legado (compatibilidade)
 * @property {number} mensal          - 1 = aparece em todos os meses (sem data_fim)
 * @property {string|null} data_inicio - Início da vigência (YYYY-MM-DD) ou null
 * @property {string|null} data_fim    - Fim da vigência (YYYY-MM-DD) ou null
 * @property {number|null} template_id - ID do template se for cópia auto-gerada, ou null
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
   * Busca templates de receitas recorrentes ativos em um determinado mês.
   * Espelho de GastosFixosRepository.findTemplatesAtivos.
   *
   * @param {string} primeiroDiaMes - "YYYY-MM-01"
   * @param {string} ultimoDiaMes   - "YYYY-MM-DD" (último dia do mês)
   * @param {string} mes            - "Julho2026" (para checar se cópia já existe)
   * @returns {Receita[]}
   */
  findTemplatesAtivos(primeiroDiaMes, ultimoDiaMes, mes) {
    return db.prepare(`
      SELECT * FROM receitas
      WHERE template_id IS NULL
        AND mes != ?
        AND (
          mensal = 1
          OR (data_fim IS NOT NULL AND data_fim >= ?)
        )
        AND (data_inicio IS NULL OR data_inicio <= ?)
        AND id NOT IN (
          SELECT template_id FROM receitas
          WHERE template_id IS NOT NULL
            AND mes = ?
        )
      ORDER BY id ASC
    `).all(mes, primeiroDiaMes, ultimoDiaMes, mes);
  },

  /**
   * Verifica se já existe uma receita exatamente igual num determinado mês.
   * Evita duplicidade ao propagar.
   */
  existeIgual(mes, categoria, descricao, cartao) {
    const row = db.prepare(`
      SELECT 1 FROM receitas
      WHERE mes = ? AND categoria = ? AND descricao = ? AND cartao = ?
        AND (recorrente = 1 OR mensal = 1 OR data_fim IS NOT NULL)
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
      INSERT INTO receitas (categoria, descricao, valor, situacao, cartao, mes, recorrente, mensal, data_inicio, data_fim, template_id)
      VALUES (@categoria, @descricao, @valor, @situacao, @cartao, @mes, @recorrente, @mensal, @data_inicio, @data_fim, @template_id)
    `);
    const result = stmt.run({
      ...dados,
      recorrente:  dados.recorrente  ?? 0,
      mensal:      dados.mensal      ?? 0,
      data_inicio: dados.data_inicio ?? null,
      data_fim:    dados.data_fim    ?? null,
      template_id: dados.template_id ?? null,
    });
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
          situacao = @situacao, cartao = @cartao, mes = @mes, recorrente = @recorrente,
          mensal = @mensal, data_inicio = @data_inicio, data_fim = @data_fim
      WHERE id = @id
    `).run({
      ...dados,
      recorrente:  dados.recorrente  ?? 0,
      mensal:      dados.mensal      ?? 0,
      data_inicio: dados.data_inicio ?? null,
      data_fim:    dados.data_fim    ?? null,
      id,
    });
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

  /**
   * Remove o template e todas as suas cópias auto-geradas.
   * @param {number} templateId
   * @returns {boolean}
   */
  deleteTemplate(templateId) {
    db.prepare('DELETE FROM receitas WHERE template_id = ?').run(templateId);
    const result = db.prepare('DELETE FROM receitas WHERE id = ?').run(templateId);
    return result.changes > 0;
  },
};

module.exports = { ReceitasRepository };
