import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { TabelaClient } from './TabelaClient'
import { buscarTRCached } from '@/backend/lib/bcb-api'
import { calcularPRICEComIndice, calcularPRICEPuro } from '@/backend/lib/calculadora/price'

export default async function TabelaPage({
  searchParams,
}: {
  searchParams: Promise<{ comTR?: string }>
}) {
  const resolvedSearchParams = await searchParams
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
    return <div>Financiamento não encontrado</div>
  }

  // Se "comTR" for passado, usamos PRICE+TR, senão PRICE Puro
  const usarTR = resolvedSearchParams.comTR !== 'false'

  const amortizacoesMapeadas = financiamento.amortizacoesExtras
    .filter(a => a.parcelaReferencia !== null)
    .map(a => ({
      parcelaReferencia: a.parcelaReferencia as number,
      valor: a.valor,
      modalidade: a.modalidade as 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'
    }))

  let tabela = []
  
  if (usarTR) {
    // Buscar TR até a data atual + 2 meses
    const dataFimTR = new Date()
    dataFimTR.setMonth(dataFimTR.getMonth() + 2)
    const indicesTR = await buscarTRCached(financiamento.dataInicio, dataFimTR)
    
    tabela = calcularPRICEComIndice({
      valorFinanciado: financiamento.valorFinanciado,
      taxaJurosNominalAnual: financiamento.taxaJurosNominalAnual,
      prazoMeses: financiamento.prazoMeses,
      seguroMensal: financiamento.seguroMensal,
      dataInicio: financiamento.dataInicio,
    }, indicesTR, amortizacoesMapeadas)
  } else {
    tabela = calcularPRICEPuro({
      valorFinanciado: financiamento.valorFinanciado,
      taxaJurosNominalAnual: financiamento.taxaJurosNominalAnual,
      prazoMeses: financiamento.prazoMeses,
      seguroMensal: financiamento.seguroMensal,
      dataInicio: financiamento.dataInicio,
    }, amortizacoesMapeadas)
  }

  const pagas = financiamento.parcelasPagas.length

  return (
    <TabelaClient 
      tabela={tabela} 
      usarTR={usarTR} 
      parcelaAtual={pagas + 1} 
      financiamentoId={financiamento.id}
    />
  )
}
