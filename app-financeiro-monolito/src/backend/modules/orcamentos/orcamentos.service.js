/**
 * orcamentos.service.js — Regras de negócio para Orçamentos.
 */
const { OrcamentosRepository } = require('./orcamentos.repository');
const { orcamentoSchema } = require('./orcamentos.schema');
const { AppError } = require('../../utils/AppError');

const OrcamentosService = {
  async listar(mes) {
    if (mes) return await OrcamentosRepository.findByMes(mes);
    return await OrcamentosRepository.findAll();
  },

  async criar(dadosRaw) {
    const validacao = orcamentoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const dados = validacao.data;

    const existente = await OrcamentosRepository.findByCategoriaAndMes(dados.categoria, dados.mes);
    if (existente) {
      throw new AppError(`Já existe um orçamento para a categoria ${dados.categoria} no mês ${dados.mes}. Atualize o existente.`, 400);
    }

    const { id } = await OrcamentosRepository.create(dados);
    return await OrcamentosRepository.findById(id);
  },

  async atualizar(id, dadosRaw) {
    const validacao = orcamentoSchema.safeParse(dadosRaw);
    if (!validacao.success) {
      throw new AppError('Dados inválidos: ' + validacao.error.errors[0].message, 400);
    }
    const dados = validacao.data;

    const orc = await OrcamentosRepository.findById(id);
    if (!orc) throw new AppError('Orçamento não encontrado', 404);

    const existente = await OrcamentosRepository.findByCategoriaAndMes(dados.categoria, dados.mes);
    if (existente && existente.id !== id) {
      throw new AppError(`Já existe um orçamento para a categoria ${dados.categoria} no mês ${dados.mes}.`, 400);
    }

    await OrcamentosRepository.update(id, dados);
    return await OrcamentosRepository.findById(id);
  },

  async deletar(id) {
    const orc = await OrcamentosRepository.findById(id);
    if (!orc) throw new AppError('Orçamento não encontrado', 404);
    await OrcamentosRepository.delete(id);
    return { id };
  },
};

module.exports = { OrcamentosService };
