/**
 * cartoes.service.js — Regras de negócio para Cartões de Crédito.
 */
const { CartoesRepository } = require('./cartoes.repository');
const { cartaoSchema } = require('./cartoes.schema');
const { AppError } = require('../../utils/AppError');

const CartoesService = {
  listar() {
    return CartoesRepository.findAll();
  },

  criar(dadosRaw) {
    const validacao = cartaoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const { id } = CartoesRepository.create(validacao.data);
    return CartoesRepository.findById(id);
  },

  atualizar(id, dadosRaw) {
    const validacao = cartaoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const cartao = CartoesRepository.findById(id);
    if (!cartao) throw new AppError('Cartão não encontrado', 404);

    CartoesRepository.update(id, validacao.data);
    return CartoesRepository.findById(id);
  },

  deletar(id) {
    const cartao = CartoesRepository.findById(id);
    if (!cartao) throw new AppError('Cartão não encontrado', 404);
    CartoesRepository.delete(id);
    return { id };
  },
};

module.exports = { CartoesService };
