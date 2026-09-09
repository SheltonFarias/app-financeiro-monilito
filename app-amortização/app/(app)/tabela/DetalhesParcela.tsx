'use client'

import { X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatBRL } from '@/backend/lib/calculadora/price'
import { format } from 'date-fns'

interface DetalhesParcelaProps {
  parcela: any
  onClose: () => void
}

export function DetalhesParcela({ parcela, onClose }: DetalhesParcelaProps) {
  if (!parcela) return null

  const data = [
    { name: 'Amortização', value: parcela.amortizacao, color: 'var(--color-success)' },
    { name: 'Juros', value: parcela.juros, color: 'var(--color-danger)' },
    { name: 'Seguro', value: parcela.seguro, color: 'var(--text-muted)' },
  ]

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div className="card w-full max-w-md bg-elevated shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-primary transition-colors">
          <X size={20} />
        </button>
        
        <h2 className="font-semibold text-lg mb-1">Parcela {parcela.parcela}</h2>
        <p className="text-sm text-muted mb-6">Vencimento em {format(new Date(parcela.dataVencimento), 'dd/MM/yyyy')}</p>
        
        <div className="flex flex-col items-center mb-6">
          <div className="text-3xl font-bold font-mono text-primary mb-1">
            {formatBRL(parcela.prestacao)}
          </div>
          <div className="text-10px text-muted uppercase tracking-wider font-semibold">Valor Total da Prestação</div>
        </div>

        <div className="h-48 w-full mb-6 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatBRL(Number(value) || 0)}
                contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-semibold text-muted uppercase">Composição</span>
          </div>
        </div>

        <div className="space-y-3">
          {data.map(item => (
            <div key={item.name} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-secondary">{item.name}</span>
              </div>
              <span className="font-semibold font-mono">{formatBRL(item.value)}</span>
            </div>
          ))}
          {parcela.correcaoTR > 0 && (
            <div className="flex justify-between items-center text-sm border-t border-subtle pt-3 mt-3">
              <span className="text-secondary">Correção Adicionada (Índice)</span>
              <span className="font-semibold font-mono text-danger">+{formatBRL(parcela.correcaoTR)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
