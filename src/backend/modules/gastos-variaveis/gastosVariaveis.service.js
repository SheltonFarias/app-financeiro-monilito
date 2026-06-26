/**
 * gastosVariaveis.service.js — Lógica de negócio de Gastos Variáveis.
 */
const { GastosVariaveisRepository } = require('./gastosVariaveis.repository');
const { AppError } = require('../../utils/AppError');

const GastosVariaveisService = {
  /**
   * Lista gastos variáveis de um mês.
   * @param {string} mes
   * @returns {import('./gastosVariaveis.repository').GastoVariavel[]}
   */
  listarPorMes(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);
    return GastosVariaveisRepository.findByMes(mes);
  },

  /**
   * Cria um novo gasto variável.
   * Converte dataCompra (camelCase do frontend) para data_compra (snake_case do DB).
   * @param {Object} dados - Dados validados pelo schema
   */
  criar(dados) {
    const NOMES_MESES = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    
    // Helper para projetar meses
    const getNextMonths = (mesAtual, qtd) => {
      const match = mesAtual.match(/([A-Za-zÀ-ú]+)(\d+)/);
      if (!match) return [mesAtual];
      let mesNome = match[1];
      let ano = parseInt(match[2], 10);
      let idx = NOMES_MESES.indexOf(mesNome);
      if (idx === -1) return [mesAtual];
      
      const meses = [mesAtual];
      for (let i = 1; i < qtd; i++) {
        idx++;
        if (idx > 11) { idx = 0; ano++; }
        meses.push(NOMES_MESES[idx] + ano);
      }
      return meses;
    };

    const parcelas = dados.qtd_parcelas || 1;
    const valorTotal = dados.valor;
    const valorParcela = parcelas > 1 ? parseFloat((valorTotal / parcelas).toFixed(2)) : valorTotal;

    const meses = getNextMonths(dados.mes, parcelas);
    let primeiroId = null;

    for (let i = 0; i < parcelas; i++) {
      const desc = parcelas > 1 ? `${dados.descricao} (${i + 1}/${parcelas})` : dados.descricao;
      const situacao = i === 0 ? dados.situacao : 'Pendente'; // Apenas a 1a pode vir "Paga" do formulário
      
      const dbDados = {
        ...dados,
        descricao: desc,
        valor: valorParcela,
        situacao: situacao,
        mes: meses[i],
        data_compra: dados.dataCompra || null,
      };
      delete dbDados.dataCompra;
      delete dbDados.qtd_parcelas;

      const { id } = GastosVariaveisRepository.create(dbDados);
      if (i === 0) primeiroId = id;
    }

    return GastosVariaveisRepository.findById(primeiroId);
  },

  /**
   * Atualiza um gasto variável existente.
   * @param {number} id
   * @param {Object} dados
   */
  atualizar(id, dados) {
    const existe = GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    const dbDados = {
      ...dados,
      data_compra: dados.dataCompra || null,
    };
    delete dbDados.dataCompra;

    GastosVariaveisRepository.update(id, dbDados);
    return GastosVariaveisRepository.findById(id);
  },

  /**
   * Atualiza apenas a situação.
   * @param {number} id
   * @param {string} situacao
   */
  atualizarStatus(id, situacao) {
    const existe = GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    GastosVariaveisRepository.updateStatus(id, situacao);
    return GastosVariaveisRepository.findById(id);
  },

  /**
   * Remove um gasto variável.
   * @param {number} id
   */
  remover(id) {
    const existe = GastosVariaveisRepository.findById(id);
    if (!existe) throw new AppError(`Gasto variável com ID ${id} não encontrado.`, 404);

    GastosVariaveisRepository.delete(id);
  },
};

module.exports = { GastosVariaveisService };
