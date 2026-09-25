const BCB_BASE_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

const SERIES = { TR: 226, IPCA: 433 };

function formatarDataBCB(data) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data);
}

function competenciaDaDataBCB(data) {
  const [dia, mes, ano] = data.split('/');
  if (!dia || !mes || !ano) return null;
  return `${ano}-${mes}`;
}

function valorNumerico(valor) {
  return Number.parseFloat(String(valor).replace(',', '.'));
}

/** Busca índices publicados no SGS/BCB e os devolve no formato YYYY-MM -> percentual. */
async function buscarIndicesBCB(tipo, inicio, fim) {
  const serie = SERIES[tipo];
  if (!serie) return new Map();

  const params = new URLSearchParams({
    formato: 'json',
    dataInicial: formatarDataBCB(inicio),
    dataFinal: formatarDataBCB(fim),
  });
  const resposta = await fetch(`${BCB_BASE_URL}.${serie}/dados?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!resposta.ok) throw new Error(`BCB respondeu ${resposta.status}.`);

  const registros = await resposta.json();
  const porCompetencia = new Map();
  for (const registro of registros) {
    const competencia = competenciaDaDataBCB(registro.dataFim || registro.data);
    const valor = valorNumerico(registro.valor);
    if (!competencia || !Number.isFinite(valor)) continue;
    if (tipo === 'TR') {
      const fatorAtual = porCompetencia.get(competencia) ?? 1;
      porCompetencia.set(competencia, fatorAtual * (1 + valor / 100));
    } else {
      porCompetencia.set(competencia, valor);
    }
  }

  if (tipo !== 'TR') return porCompetencia;
  return new Map([...porCompetencia].map(([competencia, fator]) => [competencia, (fator - 1) * 100]));
}

module.exports = { SERIES, buscarIndicesBCB };
