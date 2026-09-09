import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { buscarTRCached } from '@/backend/lib/bcb-api'
import { calcularPRICEComIndice, calcularSAC } from '@/backend/lib/calculadora/price'
import { SimuladorClient } from './SimuladorClient'

export default async function SimuladorPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id },
    include: {
      parcelasPagas: true,
      amortizacoesExtras: true,
    },
  })

  if (!financiamento) {
    return (
      <div className="card text-center p-12">
        <h2>Nenhum financiamento encontrado.</h2>
      </div>
    )
  }

  const dataFimTR = new Date()
  dataFimTR.setMonth(dataFimTR.getMonth() + 2)
  const indicesTR = await buscarTRCached(financiamento.dataInicio, dataFimTR)

  const amortizacoesMapeadas = financiamento.amortizacoesExtras
    .filter(a => a.parcelaReferencia !== null)
    .map(a => ({
      parcelaReferencia: a.parcelaReferencia as number,
      valor: a.valor,
      modalidade: a.modalidade as 'REDUZ_PRAZO' | 'REDUZ_PRESTACAO',
    }))

  const input = {
    valorFinanciado: financiamento.valorFinanciado,
    taxaJurosNominalAnual: financiamento.taxaJurosNominalAnual,
    prazoMeses: financiamento.prazoMeses,
    seguroMensal: financiamento.seguroMensal,
    dataInicio: financiamento.dataInicio,
  }

  const tabela =
    financiamento.sistemaAmort === 'SAC'
      ? calcularSAC(input, amortizacoesMapeadas)
      : calcularPRICEComIndice(input, indicesTR, amortizacoesMapeadas)

  const parcelaAtual = financiamento.parcelasPagas.length + 1

  return (
    <SimuladorClient
      tabela={tabela}
      parcelaAtual={parcelaAtual}
      input={input}
    />
  )
}
