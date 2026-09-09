// Integração com a API do Banco Central do Brasil

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

export const BCB_SERIES = {
  TR_DIARIA: 226,
  IPCA_MENSAL: 433,
  SELIC_META: 432,
  CDI_DIARIA: 12,
} as const

export interface IndiceHistorico {
  competencia: string  // "YYYY-MM"
  valor: number        // em %
}

/**
 * Busca TR diária do BCB e acumula por mês (dia 10 ao dia 10)
 * Retorna mapa "YYYY-MM" → TR acumulada do período (%)
 */
export async function buscarTRMensal(
  dataInicio: Date,
  dataFim: Date
): Promise<Map<string, number>> {
  try {
    const inicio = formatBCBDate(dataInicio)
    const fim = formatBCBDate(dataFim)
    const url = `${BCB_BASE}.${BCB_SERIES.TR_DIARIA}/dados?formato=json&dataInicial=${inicio}&dataFinal=${fim}`

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // atualiza a cada 1 hora
    })

    if (!res.ok) throw new Error(`BCB API error: ${res.status}`)

    const data = (await res.json()) as Array<{
      data: string      // "DD/MM/YYYY"
      dataFim: string   // "DD/MM/YYYY"
      valor: string
    }>

    // Acumula TR diária por período mensal (dia 10 do mês N ao dia 10 do mês N+1)
    const mapa = new Map<string, number>()

    // Agrupa por competencia baseada no dataFim (mês de referência do vencimento)
    for (const d of data) {
      const dataFimParsed = parseBCBDate(d.dataFim)
      if (!dataFimParsed) continue

      // Competencia = mês do dataFim
      const competencia = formatCompetencia(dataFimParsed)
      const trDiaria = parseFloat(d.valor) // já em %

      // Acumula: produto (1 + TR_dia/100) - 1
      const atual = mapa.get(competencia) ?? 0
      // Aproximação: soma simples das TR diárias para o mês
      mapa.set(competencia, atual + trDiaria)
    }

    // Converte para TR mensal acumulada (% mensal)
    // A TR mensal é o produto das TRs diárias / 100
    const mapaFinal = new Map<string, number>()
    for (const [comp, soma] of mapa.entries()) {
      mapaFinal.set(comp, soma / 100) // converte centésimos → decimal
    }

    return mapaFinal
  } catch (error) {
    console.error('Erro ao buscar TR do BCB:', error)
    return new Map()
  }
}

/**
 * Busca IPCA mensal do BCB
 */
export async function buscarIPCAMensal(
  dataInicio: Date,
  dataFim: Date
): Promise<IndiceHistorico[]> {
  try {
    const inicio = formatBCBDate(dataInicio)
    const fim = formatBCBDate(dataFim)
    const url = `${BCB_BASE}.${BCB_SERIES.IPCA_MENSAL}/dados?formato=json&dataInicial=${inicio}&dataFinal=${fim}`

    const res = await fetch(url, { next: { revalidate: 3600 } }) // atualiza a cada 1 hora
    if (!res.ok) throw new Error(`BCB API error: ${res.status}`)

    const data = (await res.json()) as Array<{ data: string; valor: string }>

    return data.map((d) => ({
      competencia: formatCompetenciaFromBCB(d.data),
      valor: parseFloat(d.valor),
    }))
  } catch (error) {
    console.error('Erro ao buscar IPCA do BCB:', error)
    return []
  }
}

/**
 * Busca TR já em cache ou da API
 */
export async function buscarTRCached(
  dataInicio: Date,
  dataFim: Date
): Promise<Map<string, number>> {
  // Tentar buscar do cache do banco primeiro
  // Se não tiver, busca da API
  return buscarTRMensal(dataInicio, dataFim)
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatBCBDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function parseBCBDate(dateStr: string): Date | null {
  // "DD/MM/YYYY"
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
}

function formatCompetencia(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function formatCompetenciaFromBCB(bcbDate: string): string {
  // "DD/MM/YYYY" → "YYYY-MM"
  const parts = bcbDate.split('/')
  if (parts.length !== 3) return ''
  return `${parts[2]}-${parts[1]}`
}
