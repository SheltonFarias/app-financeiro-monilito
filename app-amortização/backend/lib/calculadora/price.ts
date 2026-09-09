import type { LinhaTabela, CalculoInput, AmortizacaoExtraInput } from './tipos'

/**
 * Calcula a tabela PRICE pura (sem correção TR)
 * Prestação constante = A + J
 */
export function calcularPRICEPuro(
  input: CalculoInput,
  amortizacoesExtras?: AmortizacaoExtraInput[]
): LinhaTabela[] {
  const { valorFinanciado, taxaJurosNominalAnual, prazoMeses, seguroMensal, dataInicio } = input

  // Taxa mensal proporcional (método Caixa/CVMA)
  const i = taxaJurosNominalAnual / 100 / 12

  // PMT — prestação constante de amortização + juros
  const pmt =
    valorFinanciado * (i * Math.pow(1 + i, prazoMeses)) / (Math.pow(1 + i, prazoMeses) - 1)

  const tabela: LinhaTabela[] = []
  let saldo = valorFinanciado

  let pmtAtual = pmt
  let nRestante = prazoMeses

  for (let n = 1; n <= prazoMeses; n++) {
    const dataVenc = addMonths(dataInicio, n - 1)
    const competencia = formatCompetencia(dataVenc)

    const aporteExtra = amortizacoesExtras?.find(a => a.parcelaReferencia === n)
    let saldoAposAporte = saldo
    let pmtNovo = pmtAtual

    if (aporteExtra) {
      saldoAposAporte = Math.max(0, saldo - aporteExtra.valor)
      if (aporteExtra.modalidade === 'REDUZ_PRESTACAO') {
        pmtNovo = nRestante > 0 && saldoAposAporte > 0
          ? saldoAposAporte * (i * Math.pow(1 + i, nRestante)) / (Math.pow(1 + i, nRestante) - 1)
          : saldoAposAporte
        pmtAtual = pmtNovo
      }
    }

    const juros = saldoAposAporte * i
    const amortizacao = pmtNovo - juros

    tabela.push({
      parcela: n,
      dataVencimento: dataVenc,
      competencia,
      prestacao: pmtNovo + seguroMensal,
      amortizacao,
      juros,
      seguro: seguroMensal,
      correcaoTR: 0,
      saldoDevedor: Math.max(0, saldoAposAporte - amortizacao),
      ...(aporteExtra && { 
        amortizacaoExtraValor: aporteExtra.valor,
        amortizacaoExtraModalidade: aporteExtra.modalidade 
      })
    })

    saldo = Math.max(0, saldoAposAporte - amortizacao)
    nRestante--
    if (saldo < 0.01) break
  }

  return tabela
}

/**
 * Calcula a tabela PRICE com correção monetária real (TR, IPCA, etc)
 * A cada mês o saldo é corrigido pelo índice antes de calcular o PMT
 */
export function calcularPRICEComIndice(
  input: CalculoInput,
  indicesCorrecao: Map<string, number>, // "YYYY-MM" → Índice mensal (%)
  amortizacoesExtras?: AmortizacaoExtraInput[]
): LinhaTabela[] {
  const { valorFinanciado, taxaJurosNominalAnual, prazoMeses, seguroMensal, dataInicio } = input

  const i = taxaJurosNominalAnual / 100 / 12

  const tabela: LinhaTabela[] = []
  let saldo = valorFinanciado

  let pmtAtual = valorFinanciado * (i * Math.pow(1 + i, prazoMeses)) / (Math.pow(1 + i, prazoMeses) - 1)
  let nRestante = prazoMeses

  for (let n = 1; n <= prazoMeses; n++) {
    const dataVenc = addMonths(dataInicio, n - 1)
    const competencia = formatCompetencia(dataVenc)

    // 1. Corrigi saldo pelo índice do período
    const indiceMes = (indicesCorrecao.get(competencia) ?? 0) / 100
    const valorCorrecao = saldo * indiceMes
    const saldoCorrigido = saldo + valorCorrecao

    // Verifica amortizações extras para esta parcela
    const aporteExtra = amortizacoesExtras?.find(a => a.parcelaReferencia === n)
    let saldoAposAporte = saldoCorrigido
    let pmtNovo = pmtAtual

    if (aporteExtra) {
      saldoAposAporte = Math.max(0, saldoCorrigido - aporteExtra.valor)
      
      if (aporteExtra.modalidade === 'REDUZ_PRESTACAO') {
        // Recalcula PMT sobre saldo reduzido com prazo restante
        pmtNovo = nRestante > 0 && saldoAposAporte > 0
          ? saldoAposAporte * (i * Math.pow(1 + i, nRestante)) / (Math.pow(1 + i, nRestante) - 1)
          : saldoAposAporte
        pmtAtual = pmtNovo // Atualiza a PMT base para os próximos meses
      }
      // Se REDUZ_PRAZO, a PMT continua sendo pmtAtual (apenas com correção TR), 
      // mas o saldo cai mais rápido, encurtando o while natural do financiamento.
    } else {
      // Mesmo sem aporte, a prestação da PRICE com TR é recalculada todo mês pelo saldo corrigido.
      pmtNovo = nRestante > 0 && saldoAposAporte > 0
        ? saldoAposAporte * (i * Math.pow(1 + i, nRestante)) / (Math.pow(1 + i, nRestante) - 1)
        : saldoAposAporte
      // Aqui NÃO atualizamos pmtAtual, pois esse recálculo é natural da correção TR.
      // A PMT real que o cliente paga vai flutuar um pouquinho junto com a TR.
    }

    const juros = saldoAposAporte * i
    const amortizacao = pmtNovo - juros
    const novoSaldo = Math.max(0, saldoAposAporte - amortizacao)

    tabela.push({
      parcela: n,
      dataVencimento: dataVenc,
      competencia,
      prestacao: pmtNovo + seguroMensal,
      amortizacao,
      juros,
      seguro: seguroMensal,
      correcaoTR: valorCorrecao, // Mantemos o nome da prop na tabela para compatibilidade, mas representa a correção do índice
      saldoDevedor: novoSaldo,
      ...(aporteExtra && { 
        amortizacaoExtraValor: aporteExtra.valor,
        amortizacaoExtraModalidade: aporteExtra.modalidade 
      })
    })

    saldo = novoSaldo
    nRestante--
    if (saldo < 0.01) break
  }

  return tabela
}

/**
 * Calcula a tabela SAC (para comparativo)
 */
export function calcularSAC(
  input: CalculoInput,
  amortizacoesExtras?: AmortizacaoExtraInput[]
): LinhaTabela[] {
  const { valorFinanciado, taxaJurosNominalAnual, prazoMeses, seguroMensal, dataInicio } = input

  const i = taxaJurosNominalAnual / 100 / 12
  const amortizacaoFixa = valorFinanciado / prazoMeses

  const tabela: LinhaTabela[] = []
  let saldo = valorFinanciado
  let nRestante = prazoMeses

  for (let n = 1; n <= prazoMeses; n++) {
    const dataVenc = addMonths(dataInicio, n - 1)
    const competencia = formatCompetencia(dataVenc)

    const aporteExtra = amortizacoesExtras?.find(a => a.parcelaReferencia === n)
    let saldoAposAporte = saldo
    let amortizacaoMes = amortizacaoFixa

    if (aporteExtra) {
      saldoAposAporte = Math.max(0, saldo - aporteExtra.valor)
      if (aporteExtra.modalidade === 'REDUZ_PRESTACAO') {
        amortizacaoMes = nRestante > 0 ? saldoAposAporte / nRestante : saldoAposAporte
      }
    } else {
      // Se houve recálculo em meses anteriores por REDUZ_PRESTACAO, 
      // amortizacaoMes precisa acompanhar o novo valor. Na SAC é saldo / nRestante
      amortizacaoMes = nRestante > 0 ? saldoAposAporte / nRestante : saldoAposAporte
    }

    const juros = saldoAposAporte * i
    const pmt = amortizacaoMes + juros

    tabela.push({
      parcela: n,
      dataVencimento: dataVenc,
      competencia,
      prestacao: pmt + seguroMensal,
      amortizacao: amortizacaoMes,
      juros,
      seguro: seguroMensal,
      correcaoTR: 0,
      saldoDevedor: Math.max(0, saldoAposAporte - amortizacaoMes),
      ...(aporteExtra && { 
        amortizacaoExtraValor: aporteExtra.valor,
        amortizacaoExtraModalidade: aporteExtra.modalidade 
      })
    })

    saldo = Math.max(0, saldoAposAporte - amortizacaoMes)
    nRestante--
    if (saldo < 0.01) break
  }

  return tabela
}

/**
 * Simula o impacto de uma amortização extraordinária
 */
export function simularAmortizacaoExtra(
  tabela: LinhaTabela[],
  parcelaAtual: number,
  valorAporte: number,
  modalidade: 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO',
  input: CalculoInput
): { 
  economiaJuros: number; 
  mesesEconomizados: number; 
  novaPrestacao?: number; 
  dataProjetadaQuitacao?: Date;
  dataOriginalQuitacao?: Date;
} {
  const linhaAtual = tabela.find((l) => l.parcela === parcelaAtual)
  if (!linhaAtual) return { economiaJuros: 0, mesesEconomizados: 0 }

  const saldoAtual = linhaAtual.saldoDevedor
  const saldoDepois = Math.max(0, saldoAtual - valorAporte)
  const prazoRestante = input.prazoMeses - parcelaAtual

  // Calcula total de juros sem aporte
  const totalJurosSemAporte = tabela
    .filter((l) => l.parcela > parcelaAtual)
    .reduce((sum, l) => sum + l.juros, 0)

  // Calcula total de juros com aporte (recalcula PRICE para o novo saldo)
  const i = input.taxaJurosNominalAnual / 100 / 12

  if (modalidade === 'REDUZ_PRAZO') {
    // Mantém a mesma prestação e calcula quantas parcelas sobram
    const pmtOriginal = tabela[parcelaAtual]?.prestacao - input.seguroMensal || 0
    let s = saldoDepois
    let meses = 0
    while (s > 0.01 && meses < prazoRestante) {
      const j = s * i
      const a = pmtOriginal - j
      s = Math.max(0, s - a)
      meses++
    }
    const mesesEconomizados = prazoRestante - meses
    const totalJurosComAporte = meses > 0
      ? saldoDepois * (i * Math.pow(1 + i, meses)) / (Math.pow(1 + i, meses) - 1) * meses - saldoDepois
      : 0
    const economiaJuros = Math.max(0, totalJurosSemAporte - totalJurosComAporte)
    
    const dataOriginalQuitacao = addMonths(input.dataInicio, input.prazoMeses)
    const dataProjetadaQuitacao = addMonths(input.dataInicio, parcelaAtual + meses)

    return { 
      economiaJuros, 
      mesesEconomizados,
      dataOriginalQuitacao,
      dataProjetadaQuitacao
    }
  } else {
    // Mantém o prazo e calcula a nova prestação
    const novaPmt =
      prazoRestante > 0 && saldoDepois > 0
        ? saldoDepois * (i * Math.pow(1 + i, prazoRestante)) / (Math.pow(1 + i, prazoRestante) - 1)
        : 0
    const totalJurosComAporte =
      prazoRestante > 0 && saldoDepois > 0 ? novaPmt * prazoRestante - saldoDepois : 0
    const economiaJuros = Math.max(0, totalJurosSemAporte - totalJurosComAporte)
    
    const dataOriginalQuitacao = addMonths(input.dataInicio, input.prazoMeses)

    return { 
      economiaJuros, 
      mesesEconomizados: 0, 
      novaPrestacao: novaPmt + input.seguroMensal,
      dataOriginalQuitacao,
      dataProjetadaQuitacao: dataOriginalQuitacao
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function formatCompetencia(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, decimals = 4): string {
  return `${value.toFixed(decimals)}%`
}
