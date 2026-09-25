const { FinanciamentosRepository } = require('./financiamentos.repository');
const { AppError } = require('../../utils/AppError');
const { calcularTabela, simularAmortizacao } = require('../../lib/calculadora/price');
const { SERIES, buscarIndicesBCB } = require('../../lib/bcb');

function paraBanco(dados) {
  return {
    descricao: dados.descricao, banco: dados.banco, agencia: dados.agencia,
    numero_contrato: dados.numeroContrato, programa: dados.programa,
    valor_imovel: dados.valorImovel, valor_financiado: dados.valorFinanciado,
    recursos_proprios: dados.recursosProprios, desconto_fgts: dados.descontoFgts,
    taxa_juros_nominal_anual: dados.taxaJurosNominalAnual, taxa_efetiva_anual: dados.taxaEfetivaAnual,
    sistema_amort: dados.sistemaAmort, indice_correcao: dados.indiceCorrecao,
    prazo_meses: dados.prazoMeses, data_inicio: dados.dataInicio, parcela_atual: dados.parcelaAtual,
    prestacao_inicial_aj: dados.prestacaoInicialAj, seguro_mensal: dados.seguroMensal,
    total_mensal_inicial: dados.totalMensalInicial, tarifa_administracao: dados.tarifaAdministracao,
    garantia_fiduciaria: dados.garantiaFiduciaria,
  };
}

async function obterFinanciamento(id) {
  const financiamento = await FinanciamentosRepository.findById(id);
  if (!financiamento) throw new AppError('Financiamento não encontrado.', 404);
  return financiamento;
}

const FinanciamentosService = {
  listar() { return FinanciamentosRepository.findAll(); },
  async obter(id) { return obterFinanciamento(id); },
  criar(dados) { return FinanciamentosRepository.create(paraBanco(dados)); },
  async atualizar(id, dados) { await obterFinanciamento(id); return FinanciamentosRepository.update(id, paraBanco(dados)); },
  async remover(id) { await obterFinanciamento(id); await FinanciamentosRepository.delete(id); },
  async tabela(id) {
    const financiamento = await obterFinanciamento(id);
    const indices = await this.indices(financiamento);
    return calcularTabela(financiamento, financiamento.amortizacoes_extras, indices);
  },
  async simular(id, dados) {
    const financiamento = await obterFinanciamento(id);
    const indices = await this.indices(financiamento);
    const tabela = calcularTabela(financiamento, financiamento.amortizacoes_extras, indices);
    return simularAmortizacao(financiamento, tabela, dados, financiamento.amortizacoes_extras, indices);
  },
  async indices(financiamento) {
    if (financiamento.indice_correcao === 'NENHUM') return new Map();
    const serie = SERIES[financiamento.indice_correcao];
    const cache = await FinanciamentosRepository.findIndices(financiamento.id, serie);
    const resultado = new Map(cache.map((indice) => [indice.competencia, indice.valor]));
    try {
      const publicados = await buscarIndicesBCB(financiamento.indice_correcao, financiamento.data_inicio, new Date());
      await Promise.all([...publicados].map(async ([competencia, valor]) => {
        resultado.set(competencia, valor);
        await FinanciamentosRepository.upsertIndice(financiamento.id, serie, competencia, valor);
      }));
    } catch (error) {
      console.warn(`[Financiamentos] Não foi possível atualizar ${financiamento.indice_correcao} no BCB: ${error.message}`);
    }
    return resultado;
  },
  async registrarAmortizacao(id, dados) {
    const financiamento = await obterFinanciamento(id);
    if (dados.parcelaReferencia > financiamento.prazo_meses) throw new AppError('Parcela de referência está fora do prazo do contrato.', 400);
    const { data_projetada_quitacao, ...simulacao } = await this.simular(id, dados);
    return FinanciamentosRepository.createAmortizacao(id, {
      parcela_referencia: dados.parcelaReferencia, data_pagamento: dados.dataPagamento, valor: dados.valor,
      modalidade: dados.modalidade, observacao: dados.observacao, ...simulacao,
    });
  },
  async atualizarAmortizacao(financiamentoId, id, dados) {
    const item = await FinanciamentosRepository.findAmortizacao(id);
    if (!item || item.financiamento_id !== financiamentoId) throw new AppError('Amortização não encontrada.', 404);
    const financiamento = await obterFinanciamento(financiamentoId);
    const amortizacoesAtuais = financiamento.amortizacoes_extras.filter((amortizacao) => amortizacao.id !== id);
    const indices = await this.indices(financiamento);
    const tabela = calcularTabela(financiamento, amortizacoesAtuais, indices);
    const { data_projetada_quitacao, ...simulacao } = simularAmortizacao(financiamento, tabela, dados, amortizacoesAtuais, indices);
    return FinanciamentosRepository.updateAmortizacao(id, {
      parcela_referencia: dados.parcelaReferencia, data_pagamento: dados.dataPagamento, valor: dados.valor,
      modalidade: dados.modalidade, observacao: dados.observacao, ...simulacao,
    });
  },
  async removerAmortizacao(financiamentoId, id) {
    const item = await FinanciamentosRepository.findAmortizacao(id);
    if (!item || item.financiamento_id !== financiamentoId) throw new AppError('Amortização não encontrada.', 404);
    await FinanciamentosRepository.deleteAmortizacao(id);
  },
  async registrarPagamento(id, dados) {
    const financiamento = await obterFinanciamento(id);
    if (dados.numeroParcela > financiamento.prazo_meses) throw new AppError('Número da parcela está fora do prazo do contrato.', 400);
    const created = await FinanciamentosRepository.createPagamento(id, {
      numero_parcela: dados.numeroParcela, data_vencimento: dados.dataVencimento, data_pagamento_real: dados.dataPagamentoReal,
      valor_pago: dados.valorPago, seguro_pago: dados.seguroPago, observacao: dados.observacao,
    });
    if (!created) throw new AppError('A parcela informada já está registrada como paga.', 409);
    return created;
  },
  async removerPagamento(financiamentoId, id) {
    const item = await FinanciamentosRepository.findPagamento(id);
    if (!item || item.financiamento_id !== financiamentoId) throw new AppError('Pagamento não encontrado.', 404);
    await FinanciamentosRepository.deletePagamento(id);
  },
};

module.exports = { FinanciamentosService };
