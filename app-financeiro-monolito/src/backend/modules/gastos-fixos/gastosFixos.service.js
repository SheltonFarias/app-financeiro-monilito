/**
 * gastosFixos.service.js — Lógica de negócio do módulo Gastos Fixos.
 * Não conhece req/res do Express.
 * Lança AppError para erros de negócio esperados.
 */
const { GastosFixosRepository } = require('./gastosFixos.repository');
const { AppError } = require('../../utils/AppError');

// ─── Helpers de data ──────────────────────────────────────────────────────────

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Converte "Julho2026" em { ano: 2026, mes: 6 } (índice 0-based).
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

const GastosFixosService = {
  /**
   * Lista todos os gastos fixos de um mês.
   * Antes de retornar, propaga automaticamente os gastos recorrentes
   * que estejam dentro da vigência e ainda não tenham entrada para o mês.
   *
   * @param {string} mes - Ex: "Junho2026"
   * @returns {Promise<import('./gastosFixos.repository').GastoFixo[]>}
   * @throws {AppError} 400 se mes não for fornecido ou inválido
   */
  async listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);

    const parsed = parseMes(mes);
    if (!parsed) throw new AppError(`Mês inválido: "${mes}". Use o formato "Julho2026".`, 400);

    const { primeiroDia, ultimoDia } = intervaloMes(parsed.ano, parsed.mesIdx);

    // Propaga recorrentes antes de buscar
    await this._propagarRecorrentes(mes, primeiroDia, ultimoDia);

    return await GastosFixosRepository.findByMes(mes);
  },

  /**
   * Propaga automaticamente os gastos recorrentes (com data_fim definida)
   * que estejam dentro da vigência do mês solicitado mas ainda não tenham
   * um registro para esse mês.
   *
   * Cria um novo registro com template_id = id do template e situação "Pendente".
   *
   * @param {string} mes
   * @param {string} primeiroDia - "YYYY-MM-01"
   * @param {string} ultimoDia   - "YYYY-MM-DD"
   */
  async _propagarRecorrentes(mes, primeiroDia, ultimoDia) {
    const templates = await GastosFixosRepository.findTemplatesAtivos(primeiroDia, ultimoDia, mes);
    for (const t of templates) {
      await GastosFixosRepository.create({
        categoria:   t.categoria,
        descricao:   t.descricao,
        valor:       t.valor,
        vencimento:  t.vencimento,
        cartao:      t.cartao,
        situacao:    'Pendente',
        mes,
        mensal:      t.mensal,
        data_inicio: t.data_inicio,
        data_fim:    t.data_fim,
        template_id: t.id,
      });
    }
  },

  /**
   * Cria um novo gasto fixo e retorna o registro criado completo.
   * @param {Object} dados - Dados validados pelo schema
   * @returns {Promise<import('./gastosFixos.repository').GastoFixo>}
   */
  async criar(dados) {
    const { id } = await GastosFixosRepository.create(dados);
    return await GastosFixosRepository.findById(id);
  },

  /**
   * Atualiza todos os campos de um gasto fixo existente.
   * @param {string} id
   * @param {Object} dados - Dados validados pelo schema
   * @returns {Promise<import('./gastosFixos.repository').GastoFixo>}
   * @throws {AppError} 404 se o registro não existir
   */
  async atualizar(id, dados) {
    const existe = await GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    // template_id é gerenciado pelo sistema — nunca sobrescrever via edição manual
    const { template_id, ...dbDados } = dados;

    await GastosFixosRepository.update(id, dbDados);
    return await GastosFixosRepository.findById(id);
  },

  /**
   * Atualiza apenas o campo situacao de um gasto fixo.
   * @param {string} id
   * @param {string} situacao - "Pendente" | "Pago"
   * @returns {Promise<import('./gastosFixos.repository').GastoFixo>}
   * @throws {AppError} 404 se o registro não existir
   */
  async atualizarStatus(id, situacao) {
    const existe = await GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    await GastosFixosRepository.updateStatus(id, situacao);
    return await GastosFixosRepository.findById(id);
  },

  /**
   * Remove um gasto fixo pelo ID.
   * Se o registro for um template com cópias, remove apenas este registro
   * (as cópias futuras não serão mais geradas pois o template não existirá).
   * Para excluir TODA A SÉRIE, use removerSerie().
   * @param {string} id
   * @throws {AppError} 404 se o registro não existir
   */
  async remover(id) {
    const existe = await GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    await GastosFixosRepository.delete(id);
  },

  /**
   * Remove o template de recorrência E todas as cópias auto-geradas.
   * Use quando o usuário quer "excluir toda a série".
   * @param {string} id - ID do template (ou de qualquer cópia — resolve o template automaticamente)
   * @throws {AppError} 404 se não encontrar
   */
  async removerSerie(id) {
    const registro = await GastosFixosRepository.findById(id);
    if (!registro) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    // Resolve o template_id: se é uma cópia, sobe para o template raiz
    const templateId = registro.template_id ?? registro.id;
    await GastosFixosRepository.deleteTemplate(templateId);
  },
};

module.exports = { GastosFixosService };
