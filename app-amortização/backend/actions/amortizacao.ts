'use server'

import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarAmortizacaoExtra(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Não autorizado')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id }
  })

  if (!financiamento) throw new Error('Financiamento não encontrado')

  const parcelaReferencia = Number(formData.get('parcelaReferencia'))
  const dataPagamento = formData.get('dataPagamento') as string
  const valorStr = formData.get('valor') as string
  const valor = Number(valorStr.replace(',', '.'))
  const modalidade = formData.get('modalidade') as string

  if (!parcelaReferencia || !dataPagamento || !valor || !modalidade) {
    throw new Error('Preencha todos os campos corretamente')
  }

  await prisma.amortizacaoExtra.create({
    data: {
      financiamentoId: financiamento.id,
      parcelaReferencia,
      dataPagamento: new Date(dataPagamento),
      valor,
      modalidade,
    }
  })

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/tabela')
}

export async function editarAmortizacaoExtra(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Não autorizado')

  const parcelaReferencia = Number(formData.get('parcelaReferencia'))
  const dataPagamento = formData.get('dataPagamento') as string
  const valorStr = formData.get('valor') as string
  const valor = Number(valorStr.replace(',', '.'))
  const modalidade = formData.get('modalidade') as string

  if (!parcelaReferencia || !dataPagamento || !valor || !modalidade) {
    throw new Error('Preencha todos os campos corretamente')
  }

  await prisma.amortizacaoExtra.update({
    where: { id },
    data: {
      parcelaReferencia,
      dataPagamento: new Date(dataPagamento),
      valor,
      modalidade,
    }
  })

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/tabela')
}

export async function excluirAmortizacaoExtra(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Não autorizado')

  await prisma.amortizacaoExtra.delete({
    where: { id }
  })

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/tabela')
}
