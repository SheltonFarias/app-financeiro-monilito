const valorSeguro = (valor) => Number.isFinite(Number(valor)) ? Number(valor) : 0;

const dataCompra = (lancamento) => {
  const valor = lancamento.dataCompra ?? lancamento.data_compra;
  return /^\d{4}-\d{2}-\d{2}/.test(String(valor || '')) ? new Date(`${String(valor).slice(0, 10)}T12:00:00`) : null;
};

function proximoFechamento(cartao, referencia = new Date()) {
  const fechamento = Math.min(28, Math.max(1, Number(cartao.dia_fechamento) || 1));
  const data = new Date(referencia.getFullYear(), referencia.getMonth(), fechamento, 12);
  if (referencia > data) data.setMonth(data.getMonth() + 1);
  return data;
}

export function normalizarNomeCartao(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bcartao\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function calcularResumoCartoes(cartoes = [], gastosFixos = [], gastosVariaveis = []) {
  const lancamentos = [
    ...gastosFixos.map((gasto) => ({ ...gasto, origem: 'Gasto fixo', vinculo: gasto.cartao })),
    ...gastosVariaveis.map((gasto) => ({ ...gasto, origem: 'Gasto variável', vinculo: gasto.pagamento ?? gasto.cartao })),
  ];

  return cartoes.map((cartao) => {
    const chave = normalizarNomeCartao(cartao.nome);
    const vinculados = chave ? lancamentos.filter((lancamento) => normalizarNomeCartao(lancamento.vinculo) === chave) : [];
    const fechamento = proximoFechamento(cartao);
    const faturaAtualItens = vinculados.filter((lancamento) => !dataCompra(lancamento) || dataCompra(lancamento) <= fechamento);
    const faturaFuturaItens = vinculados.filter((lancamento) => dataCompra(lancamento) && dataCompra(lancamento) > fechamento);
    const faturaAtual = faturaAtualItens.reduce((total, lancamento) => total + valorSeguro(lancamento.valor), 0);
    const faturaFutura = faturaFuturaItens.reduce((total, lancamento) => total + valorSeguro(lancamento.valor), 0);
    const pago = vinculados.filter((lancamento) => lancamento.situacao === 'Pago').reduce((total, lancamento) => total + valorSeguro(lancamento.valor), 0);
    const pendente = faturaAtual - pago;
    const limite = valorSeguro(cartao.limite_total);
    const limitePlanejado = valorSeguro(cartao.limite_planejado) || limite;
    const previsaoGastos = faturaAtual + faturaFutura;
    const fixosVinculados = vinculados.filter((lancamento) => lancamento.origem === 'Gasto fixo').reduce((total, lancamento) => total + valorSeguro(lancamento.valor), 0);
    const variaveisVinculados = vinculados.filter((lancamento) => lancamento.origem === 'Gasto variável').reduce((total, lancamento) => total + valorSeguro(lancamento.valor), 0);

    return { ...cartao, vinculados, faturaAtualItens, faturaFuturaItens, faturaAtual, faturaFutura, fechamento, pago, pendente, limitePlanejado, previsaoGastos, fixosVinculados, variaveisVinculados, margemPlanejada: limitePlanejado - previsaoGastos, limiteDisponivel: Math.max(0, limite - faturaAtual), utilizacao: limite > 0 ? (faturaAtual / limite) * 100 : 0, utilizacaoPlanejada: limitePlanejado > 0 ? (previsaoGastos / limitePlanejado) * 100 : 0 };
  });
}
