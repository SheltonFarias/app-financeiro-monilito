/**
 * gastosFixos.service.js — Lógica de negócio do módulo Gastos Fixos.
 * Não conhece req/res do Express.
 * Lança AppError para erros de negócio esperados.
 */
const { GastosFixosRepository } = require('./gastosFixos.repository');
const { AppError } = require('../../utils/AppError');

const GastosFixosService = {
  /**
   * Lista todos os gastos fixos de um mês.
   * @param {string} mes - Ex: "Junho2026"
   * @returns {import('./gastosFixos.repository').GastoFixo[]}
   * @throws {AppError} 400 se mes não for fornecido
   */
  listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);
    return GastosFixosRepository.findByMes(mes);
  },

  /**
   * Cria um novo gasto fixo e retorna o registro criado completo.
   * @param {Object} dados - Dados validados pelo schema
   * @returns {import('./gastosFixos.repository').GastoFixo}
   */
  criar(dados) {
    const { id } = GastosFixosRepository.create(dados);
    return GastosFixosRepository.findById(id);
  },

  /**
   * Atualiza todos os campos de um gasto fixo existente.
   * @param {number} id
   * @param {Object} dados - Dados validados pelo schema
   * @returns {import('./gastosFixos.repository').GastoFixo}
   * @throws {AppError} 404 se o registro não existir
   */
  atualizar(id, dados) {
    const existe = GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    GastosFixosRepository.update(id, dados);
    return GastosFixosRepository.findById(id);
  },

  /**
   * Atualiza apenas o campo situacao de um gasto fixo.
   * @param {number} id
   * @param {string} situacao - "Pendente" | "Pago"
   * @returns {import('./gastosFixos.repository').GastoFixo}
   * @throws {AppError} 404 se o registro não existir
   */
  atualizarStatus(id, situacao) {
    const existe = GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    GastosFixosRepository.updateStatus(id, situacao);
    return GastosFixosRepository.findById(id);
  },

  /**
   * Remove um gasto fixo pelo ID.
   * @param {number} id
   * @throws {AppError} 404 se o registro não existir
   */
  remover(id) {
    const existe = GastosFixosRepository.findById(id);
    if (!existe) throw new AppError(`Gasto fixo com ID ${id} não encontrado.`, 404);

    GastosFixosRepository.delete(id);
  },
};

module.exports = { GastosFixosService };
