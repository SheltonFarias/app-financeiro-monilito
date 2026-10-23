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

/** Paleta de cores por categoria (Notion Sticker Palette) */
export const COLORS = {
  Moradia: "#62aef0",      /* accent-sky */
  Educação: "#d6b6f6",     /* accent-purple */
  Apartamento: "#62aef0",  /* accent-sky */
  Casa: "#62aef0",         /* accent-sky */
  Essenciais: "#1aae39",   /* accent-green */
  Assinaturas: "#dd5b00",  /* accent-orange */
  Saúde: "#ff64c8",        /* accent-pink */
  Lazer: "#dd5b00",        /* accent-orange */
  Provisões: "#d6b6f6",    /* accent-purple */
  Alimentação: "#1aae39",  /* accent-green */
  Transporte: "#62aef0",   /* accent-sky */
  Vestuário: "#ff64c8",    /* accent-pink */
  Veiculo: "#dd5b00",      /* accent-orange */
  Outros: "#2a9d99",       /* accent-teal */
  Trabalho: "#1aae39",     /* accent-green */
  Mãe: "#d6b6f6",          /* accent-purple */

  // Tipos de investimento
  FII: "#1aae39",          /* accent-green */
  Ação: "#62aef0",         /* accent-sky */
  ETF: "#dd5b00",          /* accent-orange */
  "Renda Fixa": "#d6b6f6", /* accent-purple */
};

/** Cores por tipo de investimento (Notion Sticker Palette) */
export const TIPO_COLOR = {
  FII: "#1aae39",          /* accent-green */
  Ação: "#62aef0",         /* accent-sky */
  ETF: "#dd5b00",          /* accent-orange */
  "Renda Fixa": "#d6b6f6", /* accent-purple */
};

/** Lista de meses disponíveis */
export const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
