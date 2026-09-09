import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { buscarTRCached } from '@/backend/lib/bcb-api'
import { calcularPRICEComIndice, calcularSAC } from '@/backend/lib/calculadora/price'
import { CalculadoraReversaClient } from './CalculadoraReversaClient'

export default async function CalculadoraReversaPage() {
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

  // Obter saldo atual usando a engine
  const dataFimTR = new Date()
  dataFimTR.setMonth(dataFimTR.getMonth() + 2)
  const indicesTR = await buscarTRCached(financiamento.dataInicio, dataFimTR)

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

  const pagas = financiamento.parcelasPagas.length
  const linhaAtualReal = tabelaReal.find((l) => l.parcela === pagas + 1) || tabelaReal[tabelaReal.length - 1]
  const prazoRestanteAtual = financiamento.prazoMeses - pagas

  return (
    <CalculadoraReversaClient 
      saldoDevedorAtual={linhaAtualReal.saldoDevedor}
      prazoRestante={prazoRestanteAtual}
      taxaJurosMensal={(financiamento.taxaJurosNominalAnual / 100) / 12}
      prestacaoAtual={linhaAtualReal.prestacao - financiamento.seguroMensal} // Usa prestação pura para cálculo
    />
  )
}
