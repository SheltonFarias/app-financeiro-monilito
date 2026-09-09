'use server'

import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarPagamento(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Não autorizado')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id }
  })

  if (!financiamento) throw new Error('Financiamento não encontrado')

  const numeroParcela = Number(formData.get('numeroParcela'))
  const dataPagamento = formData.get('dataPagamento') as string
  const valorPago = Number(formData.get('valorPago'))

  if (!numeroParcela || !dataPagamento || !valorPago) {
    throw new Error('Preencha todos os campos corretamente')
  }

  // Verifica se já existe pagamento para esta parcela
  const existe = await prisma.parcelaPaga.findUnique({
    where: {
      financiamentoId_numeroParcela: {
        financiamentoId: financiamento.id,
        numeroParcela,
      }
    }
  })

  if (existe) {
    throw new Error('A parcela informada já está registrada como paga.')
  }

  // Cria o registro da parcela
  await prisma.parcelaPaga.create({
    data: {
      financiamentoId: financiamento.id,
      numeroParcela,
      dataVencimento: new Date(dataPagamento), // Aproximação, idealmente pegaria da tabela
      dataPagamentoReal: new Date(dataPagamento),
      valorPago,
    }
  })

  // Atualiza a parcela atual no contrato
  const ultimaPaga = await prisma.parcelaPaga.findFirst({
    where: { financiamentoId: financiamento.id },
    orderBy: { numeroParcela: 'desc' }
  })
  
  if (ultimaPaga && ultimaPaga.numeroParcela >= financiamento.parcelaAtual) {
    await prisma.financiamento.update({
      where: { id: financiamento.id },
      data: { parcelaAtual: ultimaPaga.numeroParcela + 1 }
    })
  }

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/tabela')
}

export async function excluirPagamento(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Não autorizado')

  await prisma.parcelaPaga.delete({
    where: { id }
  })

  revalidatePath('/historico')
  revalidatePath('/dashboard')
  revalidatePath('/tabela')
}
