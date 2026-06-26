/**
 * Hook React que carrega dados do backend REST e os filtra por mês.
 * Substitui a integração anterior com Google Sheets via Apps Script.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchAllData } from "../utils/apiService";

/** Ordem canônica dos meses para ordenar o gráfico de evolução */
const ORDEM_MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Converte "Junho2026" → índice de ordenação (ano * 12 + mesIdx) */
const mesParaIndice = (mesStr) => {
  const match = mesStr.match(/([A-Za-zÀ-ú]+)(\d+)/);
  if (!match) return 0;
  const mesIdx = ORDEM_MESES.indexOf(match[1]);
  const ano    = parseInt(match[2], 10);
  return ano * 12 + (mesIdx >= 0 ? mesIdx : 0);
};

/** Abrevia o nome do mês para o eixo X do gráfico: "Junho2026" → "Jun/26" */
const abreviarMes = (mesStr) => {
  const match = mesStr.match(/([A-Za-zÀ-ú]+)(\d+)/);
  if (!match) return mesStr;
  return match[1].slice(0, 3) + "/" + match[2].slice(2);
};

/**
 * @param {string} mesAtual  - Mês no formato "Junho2026"
 * @returns {{ data, rawData, loading, error, refetch }}
 */
export function useSheetData(mesAtual) {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // O backend já filtra por mês no endpoint /api/dashboard?mes=...
      // mas ainda precisamos buscar dados históricos para o gráfico de evolução.
      // Por ora carregamos os dados do mês atual. Para o gráfico de evolução,
      // o backend tem /api/dashboard/historico (usado no futuro).
      const data = await fetchAllData(mesAtual);
      setRawData(data);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [mesAtual]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Os dados já vêm filtrados pelo backend — apenas computa resumo e evolução
  const data = rawData ? computeData(rawData, mesAtual) : null;

  return { data, rawData, loading, error, refetch: fetchData };
}

/**
 * Recebe os dados já filtrados pelo backend e computa resumo e evolução mensal.
 * (Evolução mensal usa apenas o mês atual por enquanto — o backend tem /historico)
 */
function computeData(rawData, mes) {
  const { gastosFixos, gastosVariaveis, receitas, investimentos } = rawData;

  const totalGastos  = [...gastosFixos, ...gastosVariaveis].reduce((s, g) => s + g.valor, 0);
  const totalReceita = receitas.reduce((s, r) => s + r.valor, 0);

  // Evolução mensal: mostra apenas o mês atual (dados históricos requerem /historico)
  const evolucaoMensal = [
    {
      mes:      abreviarMes(mes),
      receitas: totalReceita,
      gastos:   totalGastos,
      saldo:    totalReceita - totalGastos,
    },
  ];

  return {
    gastosFixos,
    gastosVariaveis,
    receitas,
    investimentos,
    resumo: {
      receitaRecebida:  receitas.filter(r => r.situacao === "Recebido").reduce((s, r) => s + r.valor, 0),
      dividasPagas:     [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pago").reduce((s, g) => s + g.valor, 0),
      dividasPendentes: [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pendente").reduce((s, g) => s + g.valor, 0),
      saldoFinal:       totalReceita - totalGastos,
      investimento:     investimentos.reduce((s, i) => s + i.quantidade * (i.precoMedio || 0), 0),
      renda:            totalReceita,
      gastoFixo:        gastosFixos.reduce((s, g) => s + g.valor, 0),
      gastoVariavel:    gastosVariaveis.reduce((s, g) => s + g.valor, 0),
    },
    evolucaoMensal,
  };
}
