/**
 * orcamentos.service.js — Regras de negócio para Orçamentos.
 */
const { OrcamentosRepository } = require('./orcamentos.repository');
const { orcamentoSchema } = require('./orcamentos.schema');
const { AppError } = require('../../utils/AppError');

const OrcamentosService = {
  listar(mes) {
    if (mes) return OrcamentosRepository.findByMes(mes);
    return OrcamentosRepository.findAll();
  },

  criar(dadosRaw) {
    const validacao = orcamentoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const dados = validacao.data;

    const existente = OrcamentosRepository.findByCategoriaAndMes(dados.categoria, dados.mes);
    if (existente) {
      throw new AppError(`Já existe um orçamento para a categoria ${dados.categoria} no mês ${dados.mes}. Atualize o existente.`, 400);
    }

    const { id } = OrcamentosRepository.create(dados);
    return OrcamentosRepository.findById(id);
  },

  atualizar(id, dadosRaw) {
    const validacao = orcamentoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const dados = validacao.data;

    const orc = OrcamentosRepository.findById(id);
    if (!orc) throw new AppError('Orçamento não encontrado', 404);

    const existente = OrcamentosRepository.findByCategoriaAndMes(dados.categoria, dados.mes);
    if (existente && existente.id !== Number(id)) {
      throw new AppError(`Já existe um orçamento para a categoria ${dados.categoria} no mês ${dados.mes}.`, 400);
    }

    OrcamentosRepository.update(id, dados);
    return OrcamentosRepository.findById(id);
  },

  deletar(id) {
    const orc = OrcamentosRepository.findById(id);
    if (!orc) throw new AppError('Orçamento não encontrado', 404);
    OrcamentosRepository.delete(id);
    return { id };
  },
};

module.exports = { OrcamentosService };
