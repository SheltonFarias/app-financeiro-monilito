/**
 * Motor de cálculo de amortização sem dependências de Next.js ou Prisma.
 * Os valores de taxa são percentuais anuais (por exemplo, 4.75).
 */
function calcularPMT(saldo, taxaMensal, meses) {
  if (saldo <= 0 || meses <= 0) return 0;
  if (taxaMensal === 0) return saldo / meses;
  const fator = Math.pow(1 + taxaMensal, meses);
  return saldo * (taxaMensal * fator) / (fator - 1);
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatCompetencia(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function indicePorParcela(amortizacoes) {
  return new Map(amortizacoes.map((item) => [item.parcela_referencia, item]));
}

function calcularTabela(input, amortizacoes = [], indices = new Map()) {
  const taxaMensal = input.taxa_juros_nominal_anual / 100 / 12;
  const extras = indicePorParcela(amortizacoes);
  const tabela = [];
  let saldo = input.valor_financiado;
  let mesesRestantes = input.prazo_meses;
  let pmtAtual = calcularPMT(saldo, taxaMensal, mesesRestantes);

  for (let parcela = 1; parcela <= input.prazo_meses && saldo > 0.01; parcela += 1) {
    const aporte = extras.get(parcela);
    const dataVencimento = addMonths(input.data_inicio, parcela - 1);
    const competencia = formatCompetencia(dataVencimento);
    const indicePercentual = input.indice_correcao === 'NENHUM' ? 0 : (indices.get(competencia) ?? 0);
    const correcaoIndice = saldo * indicePercentual / 100;
    const saldoAntesAporte = saldo + correcaoIndice;
    const saldoAposAporte = Math.max(0, saldoAntesAporte - (aporte?.valor || 0));
    let amortizacao;
    let prestacaoSemSeguro;

    if (input.sistema_amort === 'SAC') {
      amortizacao = saldoAposAporte / mesesRestantes;
      prestacaoSemSeguro = amortizacao + saldoAposAporte * taxaMensal;
    } else {
      if (aporte?.modalidade === 'REDUZ_PRESTACAO' || indicePercentual !== 0) {
        pmtAtual = calcularPMT(saldoAposAporte, taxaMensal, mesesRestantes);
      }
      prestacaoSemSeguro = Math.min(pmtAtual, saldoAposAporte + saldoAposAporte * taxaMensal);
      amortizacao = Math.max(0, prestacaoSemSeguro - saldoAposAporte * taxaMensal);
    }

    const juros = saldoAposAporte * taxaMensal;
    const saldoDevedor = Math.max(0, saldoAposAporte - amortizacao);
    tabela.push({
      parcela,
      data_vencimento: dataVencimento,
      competencia,
      prestacao: prestacaoSemSeguro + input.seguro_mensal + input.tarifa_administracao,
      amortizacao,
      juros,
      seguro: input.seguro_mensal,
      tarifa_administracao: input.tarifa_administracao,
      indice_percentual: indicePercentual,
      correcao_indice: correcaoIndice,
      saldo_antes_aporte: saldoAntesAporte,
      saldo_devedor: saldoDevedor,
      amortizacao_extra_valor: aporte?.valor || null,
      amortizacao_extra_modalidade: aporte?.modalidade || null,
    });
    saldo = saldoDevedor;
    mesesRestantes -= 1;
  }
  return tabela;
}

function simularAmortizacao(input, tabelaAtual, aporte, amortizacoesAtuais = [], indices = new Map()) {
  const parcelaAtual = aporte.parcela_referencia || input.parcela_atual;
  const linhaAtual = tabelaAtual.find((linha) => linha.parcela === parcelaAtual);
  if (!linhaAtual) return { economia_juros: 0, meses_economizados: 0, nova_prestacao: null };

  const semAporte = tabelaAtual.filter((linha) => linha.parcela >= parcelaAtual);
  const comAporte = calcularTabela(input, [...amortizacoesAtuais, {
    parcela_referencia: parcelaAtual,
    valor: aporte.valor,
    modalidade: aporte.modalidade,
  }], indices).filter((linha) => linha.parcela >= parcelaAtual);
  const jurosSemAporte = semAporte.reduce((total, linha) => total + linha.juros, 0);
  const jurosComAporte = comAporte.reduce((total, linha) => total + linha.juros, 0);
  const ultimaLinha = comAporte.at(-1);

  return {
    economia_juros: Math.max(0, jurosSemAporte - jurosComAporte),
    meses_economizados: Math.max(0, semAporte.length - comAporte.length),
    nova_prestacao: aporte.modalidade === 'REDUZ_PRESTACAO' ? comAporte[0]?.prestacao ?? null : null,
    novo_saldo_devedor: Math.max(0, linhaAtual.saldo_devedor - aporte.valor),
    data_projetada_quitacao: ultimaLinha?.data_vencimento ?? null,
  };
}

module.exports = { calcularTabela, simularAmortizacao };
