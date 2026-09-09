'use client'

import { useState } from 'react'
import { formatBRL } from '@/backend/lib/calculadora/price'
import { Calculator, Target, Clock, ArrowRight, X } from 'lucide-react'

interface CalculadoraReversaClientProps {
  saldoDevedorAtual: number
  prazoRestante: number
  taxaJurosMensal: number
  prestacaoAtual: number
}

export function CalculadoraReversaClient({
  saldoDevedorAtual,
  prazoRestante,
  taxaJurosMensal,
  prestacaoAtual
}: CalculadoraReversaClientProps) {
  const [modo, setModo] = useState<'TEMPO_ALVO' | 'APORTE_MENSAL'>('TEMPO_ALVO')
  const [mesesAlvo, setMesesAlvo] = useState(60)
  const [aporteMensalExtra, setAporteMensalExtra] = useState(1000)

  // Cálculos dinâmicos
  let resultadoExtraMensal = 0
  let resultadoMeses = 0

  const S = saldoDevedorAtual
  const i = taxaJurosMensal

  if (modo === 'TEMPO_ALVO') {
    // Quero quitar em N meses. Qual o novo PMT?
    const pmtNovo = (S * i * Math.pow(1 + i, mesesAlvo)) / (Math.pow(1 + i, mesesAlvo) - 1)
    resultadoExtraMensal = Math.max(0, pmtNovo - prestacaoAtual)
  } else {
    // Tenho E a mais por mês. Em quanto tempo quito?
    const pmtNovo = prestacaoAtual + aporteMensalExtra
    if (pmtNovo > S * i) {
      // Fórmula: N = log(PMT / (PMT - S*i)) / log(1+i)
      const num = Math.log(pmtNovo / (pmtNovo - S * i))
      const den = Math.log(1 + i)
      resultadoMeses = Math.ceil(num / den)
    } else {
      resultadoMeses = -1 // Juros maiores que a prestação, nunca paga
    }
  }

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Calculadora Reversa (Metas)</h1>
          <p className="section-sub">Defina o seu objetivo financeiro e descubra o caminho exato para alcançá-lo.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="flex bg-subtle p-1 rounded-lg mb-6">
            <button
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${modo === 'TEMPO_ALVO' ? 'bg-elevated shadow text-primary' : 'text-muted hover:text-primary'}`}
              onClick={() => setModo('TEMPO_ALVO')}
            >
              Definir Tempo Alvo
            </button>
            <button
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${modo === 'APORTE_MENSAL' ? 'bg-elevated shadow text-primary' : 'text-muted hover:text-primary'}`}
              onClick={() => setModo('APORTE_MENSAL')}
            >
              Definir Aporte Fixo
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-lg bg-brand/5 border border-brand/20 flex justify-between items-center">
              <div>
                <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">Status Atual</div>
                <div className="text-sm text-secondary">Saldo Devedor: <span className="font-mono text-primary">{formatBRL(S)}</span></div>
                <div className="text-sm text-secondary">Prazo Restante: <span className="font-mono text-primary">{prazoRestante} meses</span></div>
              </div>
            </div>

            {modo === 'TEMPO_ALVO' ? (
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <Target size={16} className="text-brand" /> 
                  Em quantos meses você quer quitar?
                </label>
                <input
                  type="number"
                  className="form-input text-lg font-mono w-full"
                  value={mesesAlvo}
                  onChange={(e) => setMesesAlvo(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={prazoRestante}
                />
                <p className="text-xs text-muted mt-2">Dica: {Math.floor(mesesAlvo / 12)} anos e {mesesAlvo % 12} meses</p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <Calculator size={16} className="text-brand" /> 
                  Aporte extra fixo todo mês (R$)
                </label>
                <input
                  type="number"
                  className="form-input text-lg font-mono w-full"
                  value={aporteMensalExtra}
                  onChange={(e) => setAporteMensalExtra(Math.max(0, Number(e.target.value)))}
                  min={0}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card bg-gradient-card flex flex-col justify-center">
          <h3 className="font-semibold text-sm mb-6 text-center opacity-80">O que você precisa fazer:</h3>
          
          <div className="flex flex-col items-center justify-center text-center animate-fadeIn">
            {modo === 'TEMPO_ALVO' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-warning/20 text-warning flex items-center justify-center mb-4">
                  <ArrowRight size={32} />
                </div>
                <div className="text-sm text-secondary mb-2">Para quitar em {mesesAlvo} meses, você precisa dar um aporte extra mensal de:</div>
                <div className="text-4xl font-bold font-mono text-warning">
                  {formatBRL(resultadoExtraMensal)}
                </div>
                <div className="mt-4 text-xs text-muted max-w-250">
                  Isso somará {formatBRL(prestacaoAtual + resultadoExtraMensal)}/mês no total (sem contar seguros e TR).
                </div>
              </>
            ) : (
              <>
                {resultadoMeses > 0 ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mb-4">
                      <Clock size={32} />
                    </div>
                    <div className="text-sm text-secondary mb-2">Com +{formatBRL(aporteMensalExtra)}/mês, você quitará o imóvel em:</div>
                    <div className="text-4xl font-bold font-mono text-success">
                      {resultadoMeses} meses
                    </div>
                    <div className="mt-4 text-xs text-muted">
                      ({Math.floor(resultadoMeses / 12)} anos e {resultadoMeses % 12} meses) <br />
                      Você economizará {prazoRestante - resultadoMeses} meses de vida!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-danger/20 text-danger flex items-center justify-center mb-4">
                      <X size={32} />
                    </div>
                    <div className="text-sm text-secondary mb-2">Valor Insuficiente</div>
                    <div className="text-xs text-muted max-w-250">
                      O novo valor não é suficiente para cobrir os juros mensais gerados.
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
