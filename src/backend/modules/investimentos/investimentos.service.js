/**
 * investimentos.service.js — Lógica de negócio do módulo Investimentos.
 */
const { InvestimentosRepository } = require('./investimentos.repository');
const { AppError } = require('../../utils/AppError');

const InvestimentosService = {
  /**
   * Lista todos os investimentos.
   * @returns {import('./investimentos.repository').Investimento[]}
   */
  listar() {
    return InvestimentosRepository.findAll();
  },

  /**
   * Cria um novo investimento.
   * Converte campos camelCase (frontend) para snake_case (banco de dados).
   * @param {Object} dados - Dados validados pelo schema
   * @throws {AppError} 409 se o ticker já existir
   */
  criar(dados) {
    const jaExiste = InvestimentosRepository.findByTicker(dados.ticker);
    if (jaExiste) {
      throw new AppError(`Investimento com ticker "${dados.ticker}" já existe. Use PUT para editar.`, 409);
    }

    const dbDados = {
      ticker:      dados.ticker,
      tipo:        dados.tipo,
      quantidade:  dados.quantidade,
      preco_medio: dados.precoMedio,
      setor:       dados.setor || null,
      data_compra: dados.dataCompra || null,
    };

    const { id } = InvestimentosRepository.create(dbDados);
    return InvestimentosRepository.findById(id);
  },

  /**
   * Atualiza um investimento existente.
   * @param {number} id
   * @param {Object} dados
   */
  atualizar(id, dados) {
    const existe = InvestimentosRepository.findById(id);
    if (!existe) throw new AppError(`Investimento com ID ${id} não encontrado.`, 404);

    // Verifica conflito de ticker (caso o ticker esteja sendo alterado)
    if (dados.ticker !== existe.ticker) {
      const tickerEmUso = InvestimentosRepository.findByTicker(dados.ticker);
      if (tickerEmUso) {
        throw new AppError(`Ticker "${dados.ticker}" já está em uso por outro investimento.`, 409);
      }
    }

    const dbDados = {
      ticker:      dados.ticker,
      tipo:        dados.tipo,
      quantidade:  dados.quantidade,
      preco_medio: dados.precoMedio,
      setor:       dados.setor || null,
      data_compra: dados.dataCompra || null,
    };

    InvestimentosRepository.update(id, dbDados);
    return InvestimentosRepository.findById(id);
  },

  /**
   * Remove um investimento.
   * @param {number} id
   */
  remover(id) {
    const existe = InvestimentosRepository.findById(id);
    if (!existe) throw new AppError(`Investimento com ID ${id} não encontrado.`, 404);

    InvestimentosRepository.delete(id);
  },
};

module.exports = { InvestimentosService };
