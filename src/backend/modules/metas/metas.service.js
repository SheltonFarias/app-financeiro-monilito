/**
 * metas.service.js — Regras de negócio para Metas.
 */
const { MetasRepository } = require('./metas.repository');
const { metaSchema } = require('./metas.schema');
const { AppError } = require('../../utils/AppError');

const MetasService = {
  listar() {
    return MetasRepository.findAll();
  },

  criar(dadosRaw) {
    const validacao = metaSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const { id } = MetasRepository.create(validacao.data);
    return MetasRepository.findById(id);
  },

  atualizar(id, dadosRaw) {
    const validacao = metaSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);

    MetasRepository.update(id, validacao.data);
    return MetasRepository.findById(id);
  },

  deletar(id) {
    const meta = MetasRepository.findById(id);
    if (!meta) throw new AppError('Meta não encontrada', 404);
    MetasRepository.delete(id);
    return { id };
  },
};

module.exports = { MetasService };
