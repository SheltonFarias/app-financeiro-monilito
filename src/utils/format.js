/**
 * Formatadores de moeda, data e porcentagem para o dashboard financeiro.
 */

/** Formata valor como moeda BRL: R$ 1.234,56 */
export const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Calcula e formata porcentagem: "24.3%" */
export const pct = (v, total) =>
  total === 0 ? "0.0%" : ((v / total) * 100).toFixed(1) + "%";

/** Formata data ISO para dd/mm/aaaa */
export const fmtDate = (d) => {
  if (!d || d === "-x-" || d === "Mensal") return d || "—";
  try {
    // Adiciona T00:00:00 para forçar o parse na timezone local caso seja uma data simples YYYY-MM-DD
    const dateStr = d.length === 10 ? d + "T00:00:00" : d;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
};

/**
 * Verifica se uma conta está vencida (data passada + situação Pendente).
 * Ignora valores especiais como "Mensal", "-x-" e "—".
 */
export const isOverdue = (vencimento, situacao) => {
  if (situacao === "Pago" || situacao === "Recebido") return false;
  if (!vencimento || vencimento === "—" || vencimento === "-x-" || vencimento === "Mensal") return false;
  try {
    const dateStr = vencimento.length === 10 ? vencimento + "T00:00:00" : vencimento;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
};


/** Retorna o mês atual no formato "MêsAno" ex: "Maio2026" */
export const getMesAtual = () => {
  const now = new Date();
  const meses = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return meses[now.getMonth()] + now.getFullYear();
};

/** Paleta de cores por categoria */
export const COLORS = {
  // Categorias de gastos
  Moradia: "#60a5fa",
  Educação: "#818cf8",
  Apartamento: "#60a5fa",
  Casa: "#38bdf8",
  Essenciais: "#4ade80",
  Assinaturas: "#f59e0b",
  Saúde: "#f87171",
  Lazer: "#f59e0b",
  Provisões: "#a78bfa",
  Alimentação: "#4ade80",
  Transporte: "#60a5fa",
  Vestuário: "#f87171",
  Veiculo: "#fb923c",
  Outros: "#94a3b8",
  Trabalho: "#4ade80",
  // Tipos de investimento
  FII: "#4ade80",
  Ação: "#60a5fa",
  ETF: "#f59e0b",
  "Renda Fixa": "#a78bfa",
};

/** Cores por tipo de investimento */
export const TIPO_COLOR = {
  FII: "#4ade80",
  Ação: "#60a5fa",
  ETF: "#f59e0b",
  "Renda Fixa": "#a78bfa",
};

/** Lista de meses disponíveis */
export const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
