import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { Settings, Percent, Building2, Landmark, FileText } from 'lucide-react'
import { formatBRL, formatPercent } from '@/backend/lib/calculadora/price'

export default async function ConfigPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id },
  })

  if (!financiamento) {
    return <div>Financiamento não encontrado</div>
  }

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Configurações e Parâmetros</h1>
          <p className="section-sub">Consulte e gerencie os detalhes do seu contrato e índices de correção.</p>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-6 border-b border-subtle pb-4">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Dados Institucionais</h3>
              <p className="text-xs text-muted">Informações bancárias do contrato</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Banco</label>
              <div className="font-medium">{financiamento.banco}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Agência</label>
              <div className="font-medium">{financiamento.agencia || 'Não informada'}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Nº Contrato</label>
              <div className="font-mono font-medium text-brand">{financiamento.numeroContrato}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Programa</label>
              <div className="font-medium">{financiamento.programa || 'Padrão'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-6 border-b border-subtle pb-4">
            <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Composição Financeira</h3>
              <p className="text-xs text-muted">Valores originais da contratação</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Valor do Imóvel</label>
              <div className="font-medium">{formatBRL(financiamento.valorImovel)}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Valor Financiado</label>
              <div className="font-medium text-success">{formatBRL(financiamento.valorFinanciado)}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Recursos Próprios</label>
              <div className="font-medium">{formatBRL(financiamento.recursosProprios)}</div>
            </div>
            <div className="form-group">
              <label className="form-label text-xs uppercase text-muted">Desconto FGTS</label>
              <div className="font-medium">{formatBRL(financiamento.descontoFGTS)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-card relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/10 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 border-b border-subtle pb-4">
          <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
            <Percent size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-warning">Taxas e Correções (Motor de Cálculo)</h3>
            <p className="text-xs text-muted">Os algoritmos da aplicação são baseados nestes parâmetros</p>
          </div>
        </div>

        <div className="grid-4 gap-6">
          <div className="form-group">
            <label className="form-label text-xs uppercase text-muted">Sistema de Amortização</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge badge-warning">{financiamento.sistemaAmort}</span>
              <span className="text-xs text-muted">Tabela Price</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-xs uppercase text-muted">Índice de Correção</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="badge badge-info">{financiamento.indiceCorrecao}</span>
              <span className="text-xs text-muted">Taxa Referencial</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-xs uppercase text-muted">Taxa Nominal (a.a.)</label>
            <div className="font-mono font-bold text-lg">{formatPercent(financiamento.taxaJurosNominalAnual, 4)}</div>
          </div>

          <div className="form-group">
            <label className="form-label text-xs uppercase text-muted">Taxa Efetiva (a.a.)</label>
            <div className="font-mono font-bold text-lg opacity-80">{formatPercent(financiamento.taxaEfetivaAnual || financiamento.taxaJurosNominalAnual, 4)}</div>
          </div>

          <div className="form-group col-span-2">
            <label className="form-label text-xs uppercase text-muted">Seguro Obrigatório Mensal</label>
            <div className="font-medium flex flex-col">
              <span>{formatBRL(financiamento.seguroMensal)}</span>
              <span className="text-10px text-muted">MIP/DFI somado a cada parcela</span>
            </div>
          </div>

          <div className="form-group col-span-2">
            <label className="form-label text-xs uppercase text-muted">Prazo Total</label>
            <div className="font-medium">{financiamento.prazoMeses} meses ({(financiamento.prazoMeses / 12).toFixed(0)} anos)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
