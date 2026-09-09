import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { buscarTRCached, buscarIPCAMensal } from '@/backend/lib/bcb-api'
import { formatPercent } from '@/backend/lib/calculadora/price'

export default async function IndicesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Buscar dados dos últimos 24 meses
  const fim = new Date()
  const inicio = new Date()
  inicio.setFullYear(inicio.getFullYear() - 2)

  const trDataMap = await buscarTRCached(inicio, fim)
  const ipcaDataList = await buscarIPCAMensal(inicio, fim)

  // Mesclar dados
  const labelsSet = new Set([...Array.from(trDataMap.keys()), ...ipcaDataList.map(i => i.competencia)])
  const labels = Array.from(labelsSet).sort((a, b) => b.localeCompare(a)) // mais recente primeiro

  const dadosMergidos = labels.map(comp => {
    const tr = trDataMap.get(comp) ?? 0
    const ipcaItem = ipcaDataList.find(i => i.competencia === comp)
    const ipca = ipcaItem ? ipcaItem.valor : 0
    return { competencia: comp, tr, ipca }
  })

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Índices Econômicos (BCB)</h1>
          <p className="section-sub">Histórico recente da Taxa Referencial (TR) e do IPCA.</p>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card-sm bg-gradient-brand text-white border-0">
          <div className="text-sm opacity-80 mb-1">Última TR Registrada</div>
          <div className="text-3xl font-bold font-mono">
            {dadosMergidos.length > 0 ? formatPercent(dadosMergidos[0].tr * 100, 4) : '-'}
          </div>
        </div>
        <div className="card-sm border-0" style={{ background: 'var(--gradient-success)' }}>
          <div className="text-sm text-white/80 mb-1">Último IPCA Registrado</div>
          <div className="text-3xl font-bold font-mono text-white">
            {dadosMergidos.length > 0 ? formatPercent(dadosMergidos[0].ipca, 2) : '-'}
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 rounded-none">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Competência</th>
                <th>Taxa Referencial (TR) ao Mês</th>
                <th>IPCA (Inflação) ao Mês</th>
              </tr>
            </thead>
            <tbody>
              {dadosMergidos.map((d) => (
                <tr key={d.competencia}>
                  <td className="font-semibold">{d.competencia}</td>
                  <td className="font-mono text-brand">
                    {formatPercent(d.tr * 100, 4)}
                  </td>
                  <td className="font-mono text-success">
                    {formatPercent(d.ipca, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
