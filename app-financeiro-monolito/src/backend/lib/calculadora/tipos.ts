// Tipos principais do motor de cálculo de amortização
// Portado de app-amortização para o monolito (app-financeiro)

export interface CalculoInput {
  valorFinanciado: number
  taxaJurosNominalAnual: number // ex: 4.75 (%)
  prazoMeses: number
  seguroMensal: number
  dataInicio: Date
}

export interface AmortizacaoExtraInput {
  parcelaReferencia: number
  valor: number
  modalidade: 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
}

export interface LinhaTabela {
  parcela: number
  dataVencimento: Date
  competencia: string  // "YYYY-MM"
  prestacao: number    // A + J + Seguro
  amortizacao: number  // A
  juros: number        // J
  seguro: number
  correcaoTR: number
  saldoDevedor: number
  amortizacaoExtraValor?: number
  amortizacaoExtraModalidade?: 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
}

export interface SimulacaoExtra {
  modalidade: 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
  valorAporte: number
  saldoAntes: number
  saldoDepois: number
  prazoAntes: number
  prazoDepois: number
  economiaJuros: number
  mesesEconomizados: number
  novaPrestacao?: number
}
