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
 * @property {string|null} data_inicio  - Início da vigência (YYYY-MM-DD) ou null
 * @property {string|null} data_fim     - Fim da vigência (YYYY-MM-DD) ou null
 * @property {number}      mensal       - 1 = aparece em todos os meses, 0 = avulso/com data_fim
 * @property {number|null} template_id  - ID do template se for cópia auto-gerada, ou null
 * @property {string} created_at
 * @property {string} updated_at
 */

const GastosFixosRepository = {
  /**
   * Busca todos os gastos fixos de um mês específico.
   * Inclui registros avulsos (template_id IS NULL e sem recorrência) e
   * cópias auto-geradas para o mês (template_id NOT NULL).
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
   * Busca templates de gastos recorrentes ativos em um determinado mês.
   * Captura dois cenários:
   *   1) mensal = 1  → propaga para todos os meses (sem data_fim)
   *   2) data_fim IS NOT NULL E data_fim >= primeiroDiaMes → propaga até aquela data
   *
   * Filtros comuns:
   *   - template_id IS NULL (é o template raiz, não uma cópia)
   *   - data_inicio IS NULL OR data_inicio <= ultimoDiaMes (já começou)
   *   - NÃO existe cópia para o mesmo template_id + mes
   *
   * @param {string} primeiroDiaMes - "YYYY-MM-01"
   * @param {string} ultimoDiaMes   - "YYYY-MM-DD" (último dia do mês)
   * @param {string} mes            - "Julho2026" (para checar se cópia já existe)
   * @returns {GastoFixo[]}
   */
  findTemplatesAtivos(primeiroDiaMes, ultimoDiaMes, mes) {
    return db.prepare(`
      SELECT * FROM gastos_fixos
      WHERE template_id IS NULL
        AND mes != ?
        AND (
          mensal = 1
          OR (data_fim IS NOT NULL AND data_fim >= ?)
        )
        AND (data_inicio IS NULL OR data_inicio <= ?)
        AND id NOT IN (
          SELECT template_id FROM gastos_fixos
          WHERE template_id IS NOT NULL
            AND mes = ?
        )
      ORDER BY id ASC
    `).all(mes, primeiroDiaMes, ultimoDiaMes, mes);
  },

  /**
   * Insere um novo gasto fixo.
   * @param {Omit<GastoFixo, 'id'|'created_at'|'updated_at'>} dados
   * @returns {{ id: number }}
   */
  create(dados) {
    const stmt = db.prepare(`
      INSERT INTO gastos_fixos (categoria, descricao, valor, vencimento, cartao, situacao, mes, mensal, data_inicio, data_fim, template_id)
      VALUES (@categoria, @descricao, @valor, @vencimento, @cartao, @situacao, @mes, @mensal, @data_inicio, @data_fim, @template_id)
    `);
    const result = stmt.run({
      ...dados,
      mensal:      dados.mensal      ?? 0,
      data_inicio: dados.data_inicio ?? null,
      data_fim:    dados.data_fim    ?? null,
      template_id: dados.template_id ?? null,
    });
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
          vencimento = @vencimento, cartao = @cartao, situacao = @situacao, mes = @mes,
          mensal = @mensal, data_inicio = @data_inicio, data_fim = @data_fim
      WHERE id = @id
    `).run({
      ...dados,
      mensal:      dados.mensal      ?? 0,
      data_inicio: dados.data_inicio ?? null,
      data_fim:    dados.data_fim    ?? null,
      id,
    });
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

  /**
   * Remove o template e todas as suas cópias auto-geradas (cascade via FK no banco).
   * Use quando o usuário quer "excluir toda a série".
   * @param {number} templateId
   * @returns {boolean}
   */
  deleteTemplate(templateId) {
    // O CASCADE do banco já remove as cópias (template_id FK),
    // mas vamos apagar explicitamente para garantir.
    db.prepare('DELETE FROM gastos_fixos WHERE template_id = ?').run(templateId);
    const result = db.prepare('DELETE FROM gastos_fixos WHERE id = ?').run(templateId);
    return result.changes > 0;
  },
};

module.exports = { GastosFixosRepository };
