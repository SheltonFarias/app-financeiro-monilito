/**
 * receitas.service.js — Lógica de negócio do módulo Receitas.
 * Suporta recorrência do tipo mensal (permanente) e data_fim (até uma data).
 * Espelho da lógica de gastosFixos.service.js.
 */
const { ReceitasRepository } = require('./receitas.repository');
const { AppError } = require('../../utils/AppError');

// ─── Helpers de mês ──────────────────────────────────────────────────────────

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Converte "Julho2026" em { ano: 2026, mesIdx: 6 } (índice 0-based).
 * Retorna null se o formato for inválido.
 * @param {string} mesStr
 * @returns {{ ano: number, mesIdx: number } | null}
 */
function parseMes(mesStr) {
  if (!mesStr) return null;
  for (let i = 0; i < MESES_PT.length; i++) {
    if (mesStr.startsWith(MESES_PT[i])) {
      const ano = parseInt(mesStr.slice(MESES_PT[i].length), 10);
      if (!isNaN(ano)) return { ano, mesIdx: i };
    }
  }
  return null;
}

/**
 * Retorna o primeiro e último dia de um mês no formato "YYYY-MM-DD".
 * @param {number} ano
 * @param {number} mesIdx - Índice 0-based (0 = Janeiro)
 * @returns {{ primeiroDia: string, ultimoDia: string }}
 */
function intervaloMes(ano, mesIdx) {
  const primeiroDia = `${ano}-${String(mesIdx + 1).padStart(2, '0')}-01`;
  const ultimo = new Date(ano, mesIdx + 1, 0); // dia 0 do próximo mês = último dia do mês atual
  const ultimoDia = `${ano}-${String(mesIdx + 1).padStart(2, '0')}-${String(ultimo.getDate()).padStart(2, '0')}`;
  return { primeiroDia, ultimoDia };
}

// ─── Service ─────────────────────────────────────────────────────────────────

const ReceitasService = {
  /**
   * Lista receitas de um mês.
   * Antes de retornar, propaga automaticamente as receitas recorrentes
   * (mensal ou com data_fim) que ainda não existam no mês solicitado.
   * @param {string} mes
   */
  async listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);

    const parsed = parseMes(mes);
    if (!parsed) throw new AppError(`Mês inválido: "${mes}". Use o formato "Julho2026".`, 400);

    const { primeiroDia, ultimoDia } = intervaloMes(parsed.ano, parsed.mesIdx);

    // Propaga recorrentes antes de buscar
    await this._propagarRecorrentes(mes, primeiroDia, ultimoDia);

    return await ReceitasRepository.findByMes(mes);
  },

  /**
   * Propaga automaticamente receitas recorrentes (mensal=1 ou data_fim definida)
   * que estejam dentro da vigência do mês solicitado mas ainda não tenham
   * um registro para esse mês.
   *
   * @param {string} mes - Ex: "Julho2026"
   * @param {string} primeiroDia - "YYYY-MM-01"
   * @param {string} ultimoDia   - "YYYY-MM-DD"
   */
  async _propagarRecorrentes(mes, primeiroDia, ultimoDia) {
    const templates = await ReceitasRepository.findTemplatesAtivos(primeiroDia, ultimoDia, mes);
    for (const t of templates) {
      await ReceitasRepository.create({
        categoria:   t.categoria,
        descricao:   t.descricao,
        valor:       t.valor,
        situacao:    'Pendente', // Novas parcelas sempre nascem Pendentes
        cartao:      t.cartao || '—',
        mes,
        recorrente:  t.mensal ? true : false,
        mensal:      t.mensal,
        data_inicio: t.data_inicio,
        data_fim:    t.data_fim,
        template_id: t.id,
      });
    }
  },

  /**
   * Cria uma nova receita.
   * @param {Object} dados
   */
  async criar(dados) {
    const { id } = await ReceitasRepository.create(dados);
    return await ReceitasRepository.findById(id);
  },

  /**
   * Atualiza uma receita existente.
   * @param {string} id
   * @param {Object} dados
   */
  async atualizar(id, dados) {
    const existe = await ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    await ReceitasRepository.update(id, dados);
    return await ReceitasRepository.findById(id);
  },

  /**
   * Atualiza apenas a situação de uma receita.
   * @param {string} id
   * @param {string} situacao
   */
  async atualizarStatus(id, situacao) {
    const existe = await ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    await ReceitasRepository.updateStatus(id, situacao);
    return await ReceitasRepository.findById(id);
  },

  /**
   * Remove uma receita.
   * @param {string} id
   */
  async remover(id) {
    const existe = await ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    await ReceitasRepository.delete(id);
  },

  /**
   * Remove o template de recorrência E todas as cópias auto-geradas.
   * @param {string} id - ID do template (ou de qualquer cópia)
   */
  async removerSerie(id) {
    const registro = await ReceitasRepository.findById(id);
    if (!registro) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    const templateId = registro.template_id ?? registro.id;
    await ReceitasRepository.deleteTemplate(templateId);
  },
};

module.exports = { ReceitasService };
