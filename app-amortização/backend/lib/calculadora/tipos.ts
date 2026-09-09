// Tipos principais do motor de cálculo

export interface CalculoInput {
  valorFinanciado: number
  taxaJurosNominalAnual: number // ex: 4.75
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
  correcaoTR: number   // quanto o saldo cresceu pela TR naquele mês
  saldoDevedor: number // saldo após pagamento
  amortizacaoExtraValor?: number // valor de aporte extra nesta parcela
  amortizacaoExtraModalidade?: 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
}

export interface ResumoFinanciamento {
  saldoAtual: number
  parcelasPagas: number
  prazoRestante: number
  totalPagoReal: number
  totalJurosAcumulado: number
  totalAmortizado: number
  totalCorrecaoTR: number
  percentualAmortizado: number
  proximaParcela: number
  proximaDataVencimento: Date
  prestacaoEstimadaProxima: number
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
  novaPrestacao?: number  // se REDUZ_PRESTACAO
}
