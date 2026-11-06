export function addMonths(competencia, quantity = 6) {
  const [year, month] = competencia.split("-").map(Number);
  return Array.from({ length: quantity }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return date.toISOString().slice(0, 7);
  });
}

export function buildLocacoesDashboard(imoveis, contratos, competencia) {
  const ativos = contratos.filter((contrato) => contrato.status === "Ativo");
  const cobrancas = ativos.flatMap((contrato) =>
    (contrato.cobrancas || []).map((cobranca) => ({ ...cobranca, contrato })),
  );
  const cobrancasDaCompetencia = cobrancas.filter((cobranca) => cobranca.competencia === competencia);
  const previsto = cobrancasDaCompetencia.reduce((total, cobranca) => total + Number(cobranca.valor_previsto || 0), 0);
  const recebido = cobrancasDaCompetencia.reduce((total, cobranca) => total + Number(cobranca.valor_recebido || 0), 0);
  const pendente = Math.max(0, previsto - recebido);
  const meses = addMonths(competencia);

  return {
    totalImoveis: imoveis.length,
    ocupados: imoveis.filter((imovel) => imovel.status === "Ocupado").length,
    disponiveis: imoveis.filter((imovel) => imovel.status !== "Ocupado").length,
    contratosAtivos: ativos.length,
    previsto,
    recebido,
    pendente,
    cobrancasEmAberto: cobrancasDaCompetencia.filter((cobranca) => cobranca.situacao !== "Recebida"),
    renovacoes: ativos.filter((contrato) => {
      if (!contrato.fim) return false;
      const diff = new Date(contrato.fim).getTime() - new Date().setHours(0, 0, 0, 0);
      return diff >= 0 && diff <= 60 * 24 * 60 * 60 * 1000;
    }),
    fluxo: meses.map((mes) => ({
      competencia: mes,
      previsto: ativos.reduce((total, contrato) => {
        const contratoTerminaAntesDoMes = contrato.fim && String(contrato.fim).slice(0, 7) < mes;
        return total + (contratoTerminaAntesDoMes ? 0 : Number(contrato.aluguel_base || 0));
      }, 0),
      recebido: cobrancas
        .filter((cobranca) => cobranca.competencia === mes)
        .reduce((total, cobranca) => total + Number(cobranca.valor_recebido || 0), 0),
    })),
  };
}
