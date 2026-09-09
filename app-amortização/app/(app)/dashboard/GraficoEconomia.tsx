'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/backend/lib/calculadora/price'

export function GraficoEconomia({ data }: { data: any[] }) {
  return (
    <div className="card h-full">
      <h3 className="font-semibold text-sm mb-4">Capital vs Juros (Acumulado)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis 
              dataKey="mes" 
              stroke="var(--text-muted)" 
              fontSize={11} 
              tickFormatter={(val) => val.substring(2)}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={11}
              tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: any) => formatBRL(value as number)}
              contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
            <Area 
              type="monotone" 
              dataKey="amortizacaoAcumulada" 
              name="Capital Amortizado" 
              stackId="1" 
              stroke="var(--color-success)" 
              fill="var(--color-success)" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="jurosAcumulados" 
              name="Juros Pagos" 
              stackId="1" 
              stroke="var(--color-danger)" 
              fill="var(--color-danger)" 
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
