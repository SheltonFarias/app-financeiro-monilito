import { NextResponse } from 'next/server'
import { prisma } from '@/backend/lib/prisma'
import { buscarTRCached } from '@/backend/lib/bcb-api'
import { auth } from '@/backend/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get('inicio')
    const endParam = searchParams.get('fim')

    const inicio = startParam ? new Date(startParam) : new Date('2021-12-01')
    const fim = endParam ? new Date(endParam) : new Date()

    const indicesTR = await buscarTRCached(inicio, fim)

    // Converte Map para Objeto simples para serialização JSON
    const trMap: Record<string, number> = {}
    for (const [key, val] of indicesTR.entries()) {
      trMap[key] = val
    }

    return NextResponse.json(trMap)
  } catch (error) {
    console.error('[API_TR_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
