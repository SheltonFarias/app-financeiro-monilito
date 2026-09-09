import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { DashboardClient } from './DashboardClient'
import { buscarTRCached } from '@/backend/lib/bcb-api'
import { calcularPRICEComIndice, calcularPRICEPuro, calcularSAC } from '@/backend/lib/calculadora/price'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id },
    include: { 
      parcelasPagas: true,
      amortizacoesExtras: true 
    },
  })

  if (!financiamento) {
    return (
      <div className="card text-center p-12">
        <h2>Nenhum financiamento encontrado.</h2>
      </div>
    )
  }

  // Buscar TR até a data atual
  const dataFimTR = new Date()
  dataFimTR.setMonth(dataFimTR.getMonth() + 2) // margem
  const indicesTR = await buscarTRCached(financiamento.dataInicio, dataFimTR)

  // Calcular Tabela Teórica (Sem TR)
  const tabelaTeorica = calcularPRICEPuro({
    valorFinanciado: financiamento.valorFinanciado,
    taxaJurosNominalAnual: financiamento.taxaJurosNominalAnual,
    prazoMeses: financiamento.prazoMeses,
    seguroMensal: financiamento.seguroMensal,
    dataInicio: financiamento.dataInicio,
  })

  // Calcular Tabela Real (Com TR)
  const amortizacoesMapeadas = financiamento.amortizacoesExtras
    .filter(a => a.parcelaReferencia !== null)
    .map(a => ({
      parcelaReferencia: a.parcelaReferencia as number,
      valor: a.valor,
      modalidade: a.modalidade as 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
    }))

  const input = {
    valorFinanciado: financiamento.valorFinanciado,
    taxaJurosNominalAnual: financiamento.taxaJurosNominalAnual,
    prazoMeses: financiamento.prazoMeses,
    seguroMensal: financiamento.seguroMensal,
    dataInicio: financiamento.dataInicio,
  }

  const tabelaReal = financiamento.sistemaAmort === 'SAC'
    ? calcularSAC(input, amortizacoesMapeadas)
    : calcularPRICEComIndice(input, indicesTR, amortizacoesMapeadas)

  // Obter parcela atual (última paga ou a do mês atual se não paga)
  const pagas = financiamento.parcelasPagas.length
  const linhaAtualReal = tabelaReal.find((l) => l.parcela === pagas + 1) || tabelaReal[tabelaReal.length - 1]
  const linhaAtualTeorica = tabelaTeorica.find((l) => l.parcela === pagas + 1) || tabelaTeorica[tabelaTeorica.length - 1]

  const totalPagoReal = financiamento.parcelasPagas.reduce((acc, p) => acc + p.valorPago, 0)
  
  // Total de Juros e Amortização até a parcela atual
  const totalJurosAcumulado = tabelaReal.slice(0, pagas).reduce((sum, l) => sum + l.juros, 0)
  const totalAmortizado = tabelaReal.slice(0, pagas).reduce((sum, l) => sum + l.amortizacao, 0)
  const totalTR = tabelaReal.slice(0, pagas).reduce((sum, l) => sum + l.correcaoTR, 0)

  // Extrair as últimas 12 TRs para o mini-gráfico
  const trEntries = Array.from(indicesTR.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const ultimas12TRs = trEntries.slice(-12).map(([comp, val]) => ({
    competencia: comp,
    valor: val,
  }))

  let acumJuros = 0
  let acumAmort = 0
  const chartData = tabelaReal.map((r, i) => {
    const teorico = tabelaTeorica[i]
    acumJuros += r.juros
    acumAmort += r.amortizacao
    return {
      mes: r.competencia,
      saldoReal: r.saldoDevedor,
      saldoTeorico: teorico?.saldoDevedor || 0,
      prestacaoReal: r.prestacao,
      jurosAcumulados: acumJuros,
      amortizacaoAcumulada: acumAmort,
      tr: (indicesTR.get(r.competencia) ?? 0) * 100 // em %
    }
  })

  const dataQuitacaoOriginal = tabelaTeorica[tabelaTeorica.length - 1].dataVencimento
  const dataQuitacaoProjetada = tabelaReal[tabelaReal.length - 1].dataVencimento
  const mesesEconomizados = tabelaTeorica.length - tabelaReal.length

  return (
    <DashboardClient 
      financiamento={financiamento}
      saldoAtualReal={linhaAtualReal.saldoDevedor}
      saldoAtualTeorico={linhaAtualTeorica.saldoDevedor}
      parcelasPagas={pagas}
      totalPago={totalPagoReal}
      proximaPrestacao={linhaAtualReal.prestacao}
      proximaData={linhaAtualReal.dataVencimento.toISOString()}
      jurosTotais={totalJurosAcumulado}
      amortizadoTotal={totalAmortizado}
      trTotal={totalTR}
      ultimasTRs={ultimas12TRs}
      chartData={chartData}
      dataQuitacaoOriginal={dataQuitacaoOriginal.toISOString()}
      dataQuitacaoProjetada={dataQuitacaoProjetada.toISOString()}
      mesesEconomizados={mesesEconomizados}
    />
  )
}
