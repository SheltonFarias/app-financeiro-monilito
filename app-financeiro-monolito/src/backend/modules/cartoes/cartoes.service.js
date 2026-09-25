/**
 * cartoes.service.js — Regras de negócio para Cartões de Crédito.
 */
const { CartoesRepository } = require('./cartoes.repository');
const { cartaoSchema } = require('./cartoes.schema');
const { AppError } = require('../../utils/AppError');

const CartoesService = {
  async listar() {
    return await CartoesRepository.findAll();
  },

  async criar(dadosRaw) {
    const validacao = cartaoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const { id } = await CartoesRepository.create(validacao.data);
    return await CartoesRepository.findById(id);
  },

  async atualizar(id, dadosRaw) {
    const validacao = cartaoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const cartao = await CartoesRepository.findById(id);
    if (!cartao) throw new AppError('Cartão não encontrado', 404);

    await CartoesRepository.update(id, validacao.data);
    return await CartoesRepository.findById(id);
  },

  async deletar(id) {
    const cartao = await CartoesRepository.findById(id);
    if (!cartao) throw new AppError('Cartão não encontrado', 404);
    await CartoesRepository.delete(id);
    return { id };
  },
};

module.exports = { CartoesService };
