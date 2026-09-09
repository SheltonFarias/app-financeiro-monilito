'use client'

import { formatBRL, formatPercent } from '@/backend/lib/calculadora/price'
import { ProgressRing } from '@/frontend/components/ProgressRing'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Banknote, TrendingUp, PiggyBank, CalendarClock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { GraficoEconomia } from './GraficoEconomia'

interface DashboardClientProps {
  financiamento: any
  saldoAtualReal: number
  saldoAtualTeorico: number
  parcelasPagas: number
  totalPago: number
  proximaPrestacao: number
  proximaData: string
  jurosTotais: number
  amortizadoTotal: number
  trTotal: number
  ultimasTRs: { competencia: string; valor: number }[]
  chartData: any[]
  dataQuitacaoOriginal: string
  dataQuitacaoProjetada: string
  mesesEconomizados: number
}

export function DashboardClient({
  financiamento,
  saldoAtualReal,
  saldoAtualTeorico,
  parcelasPagas,
  totalPago,
  proximaPrestacao,
  proximaData,
  jurosTotais,
  amortizadoTotal,
  trTotal,
  ultimasTRs,
  chartData,
  dataQuitacaoOriginal,
  dataQuitacaoProjetada,
  mesesEconomizados,
}: DashboardClientProps) {
  const percentualAmortizado = (parcelasPagas / financiamento.prazoMeses) * 100

  // Filter chart to show up to current parcel + 60 months
  const viewChartData = chartData.slice(0, parcelasPagas + 60)

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Visão Geral</h1>
          <p className="section-sub">Acompanhamento atualizado com taxas reais do BCB</p>
        </div>
      </div>

      {ultimasTRs.length >= 2 && ultimasTRs[ultimasTRs.length - 1].valor > ultimasTRs[ultimasTRs.length - 2].valor && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3 animate-fadeIn">
          <div className="text-warning mt-0.5"><AlertTriangle size={20} /></div>
          <div>
            <h4 className="font-semibold text-warning text-sm">Alerta de Mercado: A Taxa Referencial (TR) subiu!</h4>
            <p className="text-xs text-secondary mt-1">O índice de correção sofreu um aumento no último mês registrado. Isso significa que o impacto fantasma no seu saldo devedor será maior. Considere realizar um aporte extra no Simulador para neutralizar esse impacto!</p>
          </div>
        </div>
      )}

      <div className="grid-4 mb-6">
        <div className="metric-card">
          <div className="metric-card-label">Saldo Devedor Atual</div>
          <div className="metric-card-value">{formatBRL(saldoAtualReal)}</div>
          <div className="metric-card-sub text-muted">Original: {formatBRL(financiamento.valorFinanciado)}</div>
          <div className="metric-card-icon bg-brand/10 text-brand"><Banknote /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Próxima Parcela ({parcelasPagas + 1}ª)</div>
          <div className="metric-card-value">{formatBRL(proximaPrestacao)}</div>
          <div className="metric-card-sub text-warning">Vence em: {format(new Date(proximaData), 'dd/MM/yyyy')}</div>
          <div className="metric-card-icon bg-warning/10 text-warning"><CalendarClock /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Total Já Pago</div>
          <div className="metric-card-value">{formatBRL(totalPago)}</div>
          <div className="metric-card-sub text-success">Juros: {formatBRL(jurosTotais)}</div>
          <div className="metric-card-icon bg-success/10 text-success"><PiggyBank /></div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Impacto da TR</div>
          <div className="metric-card-value text-danger">+{formatBRL(trTotal)}</div>
          <div className="metric-card-sub text-muted">Somado ao saldo devedor</div>
          <div className="metric-card-icon bg-danger/10 text-danger"><TrendingUp /></div>
        </div>
      </div>

      <div className="grid-3 mb-6">
        {/* Progresso */}
        <div className="card flex flex-col items-center justify-center py-6 px-4">
          <ProgressRing percent={percentualAmortizado} label="Amortizado" />
          <div className="mt-6 text-center w-full">
            <div className="text-sm font-semibold mb-1">{parcelasPagas} de {financiamento.prazoMeses} parcelas pagas</div>
            
            <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20 w-full">
              <div className="text-10px font-semibold text-success uppercase tracking-wider mb-1">Projeção de Quitação</div>
              <div className="text-sm font-medium text-primary">
                {format(new Date(dataQuitacaoProjetada), 'MMM yyyy').toUpperCase()}
              </div>
              {mesesEconomizados > 0 && (
                <div className="text-xs text-muted mt-1">
                  Antecipada em <span className="text-success font-semibold">{mesesEconomizados} meses</span><br/>
                  (Original: {format(new Date(dataQuitacaoOriginal), 'MM/yyyy')})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico Saldo */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="font-semibold text-sm mb-4">Evolução do Saldo Devedor</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  stroke="#475569" 
                  fontSize={11} 
                  tickFormatter={(val) => val.substring(2)} // ex: 2024-06 -> 24-06
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={11}
                  tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any) => formatBRL(value as number)}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="saldoReal" 
                  name="Saldo com TR (Real)" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReal)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="saldoTeorico" 
                  name="Saldo sem TR (Teórico)" 
                  stroke="#10b981" 
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center text-xs">
            <div className="flex items-center gap-1 text-brand"><span className="w-3 h-3 rounded-full bg-brand"></span> Saldo Real</div>
            <div className="flex items-center gap-1 text-success"><span className="w-3 h-3 rounded-full bg-success"></span> Saldo Teórico</div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <GraficoEconomia data={viewChartData} />
        
        <div className="card">
          <h3 className="font-semibold text-sm mb-4">Taxa Referencial (TR) — Últimos 12 meses</h3>
          <div className="flex justify-between items-end gap-2 overflow-x-auto pb-2 h-200">
            {ultimasTRs.map((tr) => (
              <div key={tr.competencia} className="flex flex-col items-center flex-1 min-w-40 h-full justify-end">
                <div className="text-10px text-muted mb-1">{tr.competencia.split('-')[1]}/{tr.competencia.split('-')[0].slice(2)}</div>
                <div 
                  className="w-full bg-brand/20 hover:bg-brand/40 rounded-t-sm transition-colors relative group"
                  style={{ height: `${Math.max(10, tr.valor * 100 * 300)}px` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-elevated border border-default px-2 py-1 rounded text-10px whitespace-nowrap transition-opacity">
                    {formatPercent(tr.valor * 100)}
                  </div>
                </div>
                <div className="text-10px font-mono font-medium mt-1">{formatPercent(tr.valor * 100, 2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
