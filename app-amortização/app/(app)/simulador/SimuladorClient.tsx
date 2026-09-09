'use client'

import { useState } from 'react'
import { Calculator, CalendarClock, TrendingDown, Banknote } from 'lucide-react'
import { formatBRL } from '@/backend/lib/calculadora/price'
import { simularAmortizacaoExtra } from '@/backend/lib/calculadora/price'
import type { LinhaTabela, CalculoInput } from '@/backend/lib/calculadora/tipos'
import { format } from 'date-fns'

interface SimuladorClientProps {
  tabela: LinhaTabela[]
  parcelaAtual: number
  input: CalculoInput
}

export function SimuladorClient({ tabela, parcelaAtual, input }: SimuladorClientProps) {
  const [valorAporte, setValorAporte] = useState(5000)
  const [modalidade, setModalidade] = useState<'REDUZ_PRAZO' | 'REDUZ_PRESTACAO'>('REDUZ_PRAZO')

  // Cálculo em tempo real usando o motor real
  const resultado = simularAmortizacaoExtra(
    tabela,
    parcelaAtual,
    valorAporte,
    modalidade,
    input
  )

  const linhaAtual = tabela.find(l => l.parcela === parcelaAtual) || tabela[0]
  const saldoAtual = linhaAtual?.saldoDevedor ?? 0

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Simulador de Aportes Extraordinários</h1>
          <p className="section-sub">Resultados calculados em tempo real com o motor matemático PRICE real do seu contrato.</p>
        </div>
      </div>

      {/* Contexto atual */}
      <div className="grid-4 mb-6">
        <div className="metric-card">
          <div className="metric-card-label">Saldo Devedor Atual</div>
          <div className="metric-card-value">{formatBRL(saldoAtual)}</div>
          <div className="metric-card-sub text-muted">Parcela {parcelaAtual} de {input.prazoMeses}</div>
          <div className="metric-card-icon bg-brand/10 text-brand"><Banknote /></div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Prestação Atual</div>
          <div className="metric-card-value">{formatBRL(linhaAtual?.prestacao ?? 0)}</div>
          <div className="metric-card-sub text-muted">Incluindo seguro</div>
          <div className="metric-card-icon bg-warning/10 text-warning"><CalendarClock /></div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Juros Restantes</div>
          <div className="metric-card-value text-danger">
            {formatBRL(tabela.filter(l => l.parcela >= parcelaAtual).reduce((s, l) => s + l.juros, 0))}
          </div>
          <div className="metric-card-sub text-muted">Sem amortização extra</div>
          <div className="metric-card-icon bg-danger/10 text-danger"><TrendingDown /></div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Prazo Restante</div>
          <div className="metric-card-value">{input.prazoMeses - parcelaAtual + 1} meses</div>
          <div className="metric-card-sub text-muted">
            {Math.floor((input.prazoMeses - parcelaAtual + 1) / 12)} anos e{' '}
            {(input.prazoMeses - parcelaAtual + 1) % 12} meses
          </div>
          <div className="metric-card-icon bg-success/10 text-success"><Calculator /></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Formulário */}
        <div className="card">
          <h3 className="font-semibold text-sm mb-4">Parâmetros da Simulação</h3>

          <div className="form-group mb-6">
            <label className="form-label text-xs uppercase tracking-wider">Valor do Aporte Extra (R$)</label>
            <input
              type="number"
              className="form-input text-lg font-mono"
              value={valorAporte}
              min={100}
              step={100}
              onChange={(e) => setValorAporte(Math.max(0, Number(e.target.value)))}
            />
            <p className="text-xs text-muted mt-2">
              Equivale a {saldoAtual > 0 ? ((valorAporte / saldoAtual) * 100).toFixed(2) : '0'}% do saldo devedor atual
            </p>
          </div>

          <div className="form-group mb-6">
            <label className="form-label text-xs uppercase tracking-wider mb-2">Modalidade</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                className={`btn ${modalidade === 'REDUZ_PRAZO' ? 'btn-primary' : 'btn-secondary'} h-24 flex-col`}
                onClick={() => setModalidade('REDUZ_PRAZO')}
              >
                <CalendarClock className="mb-2" />
                Reduzir Prazo
                <span className="text-10px font-normal opacity-70 mt-1">(Recomendado)</span>
              </button>

              <button
                className={`btn ${modalidade === 'REDUZ_PRESTACAO' ? 'btn-primary' : 'btn-secondary'} h-24 flex-col`}
                onClick={() => setModalidade('REDUZ_PRESTACAO')}
              >
                <TrendingDown className="mb-2" />
                Reduzir Parcela
                <span className="text-10px font-normal opacity-70 mt-1">(Mantém o Prazo)</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-brand/5 border border-brand/20 text-xs text-secondary">
            <strong className="text-brand">Como funciona?</strong> O cálculo usa o motor matemático PRICE real do seu contrato, 
            com os dados atuais de saldo e prazo. O resultado é um cenário futuro projetado — a TR futura não está incluída.
          </div>
        </div>

        {/* Resultado em tempo real */}
        <div className="card bg-gradient-card flex flex-col justify-between">
          <h3 className="font-semibold text-sm mb-6">Resultado da Simulação</h3>

          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Economia de Juros */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <div className="text-sm text-secondary">Economia Total de Juros</div>
                <div className="text-2xl font-bold font-mono text-success">
                  {formatBRL(resultado.economiaJuros)}
                </div>
                <div className="text-xs text-muted">
                  Com {formatBRL(valorAporte)} a menos no saldo devedor
                </div>
              </div>
            </div>

            {/* Meses Economizados (só REDUZ_PRAZO) */}
            {modalidade === 'REDUZ_PRAZO' && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand/20 text-brand flex items-center justify-center">
                  <CalendarClock size={24} />
                </div>
                <div>
                  <div className="text-sm text-secondary">Meses Economizados</div>
                  <div className="text-2xl font-bold font-mono text-brand">
                    {resultado.mesesEconomizados} meses
                  </div>
                  <div className="text-xs text-muted">
                    Aproximadamente {(resultado.mesesEconomizados / 12).toFixed(1)} anos a menos
                  </div>
                </div>
              </div>
            )}

            {/* Nova Prestação (só REDUZ_PRESTACAO) */}
            {modalidade === 'REDUZ_PRESTACAO' && resultado.novaPrestacao && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/20 text-warning flex items-center justify-center">
                  <Calculator size={24} />
                </div>
                <div>
                  <div className="text-sm text-secondary">Nova Prestação Mensal</div>
                  <div className="text-2xl font-bold font-mono text-warning">
                    {formatBRL(resultado.novaPrestacao)}
                  </div>
                  <div className="text-xs text-muted">
                    Redução de {formatBRL((linhaAtual?.prestacao ?? 0) - resultado.novaPrestacao)}/mês
                  </div>
                </div>
              </div>
            )}

            {/* Datas de Quitação */}
            {resultado.dataOriginalQuitacao && resultado.dataProjetadaQuitacao && (
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <div className="text-10px font-semibold text-success uppercase tracking-wider mb-2">
                  Projeção de Quitação
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted">Original</div>
                    <div className="text-sm font-mono font-semibold">
                      {format(resultado.dataOriginalQuitacao, 'MM/yyyy')}
                    </div>
                  </div>
                  <div className="text-brand font-bold text-xl">→</div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Com o aporte</div>
                    <div className="text-sm font-mono font-semibold text-success">
                      {format(resultado.dataProjetadaQuitacao, 'MM/yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ROI do aporte */}
          {valorAporte > 0 && resultado.economiaJuros > 0 && (
            <div className="mt-6 p-3 rounded-lg bg-brand/5 border border-brand/20 text-center">
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Retorno sobre o aporte</div>
              <div className="text-lg font-bold font-mono text-brand">
                {((resultado.economiaJuros / valorAporte) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted">
                Para cada R$1 investido, você economiza {formatBRL(resultado.economiaJuros / valorAporte)} em juros
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
