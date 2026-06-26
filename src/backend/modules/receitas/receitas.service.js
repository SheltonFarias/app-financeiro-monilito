/**
 * receitas.service.js — Lógica de negócio do módulo Receitas.
 */
const { ReceitasRepository } = require('./receitas.repository');
const { AppError } = require('../../utils/AppError');

const ReceitasService = {
  /**
   * Lista receitas de um mês.
   * @param {string} mes
   */
  listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);
    return ReceitasRepository.findByMes(mes);
  },

  /**
   * Cria uma nova receita.
   * @param {Object} dados
   */
  criar(dados) {
    const { id } = ReceitasRepository.create(dados);
    return ReceitasRepository.findById(id);
  },

  /**
   * Atualiza uma receita existente.
   * @param {number} id
   * @param {Object} dados
   */
  atualizar(id, dados) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.update(id, dados);
    return ReceitasRepository.findById(id);
  },

  /**
   * Atualiza apenas a situação de uma receita.
   * @param {number} id
   * @param {string} situacao
   */
  atualizarStatus(id, situacao) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.updateStatus(id, situacao);
    return ReceitasRepository.findById(id);
  },

  /**
   * Remove uma receita.
   * @param {number} id
   */
  remover(id) {
    const existe = ReceitasRepository.findById(id);
    if (!existe) throw new AppError(`Receita com ID ${id} não encontrada.`, 404);

    ReceitasRepository.delete(id);
  },
};

module.exports = { ReceitasService };
