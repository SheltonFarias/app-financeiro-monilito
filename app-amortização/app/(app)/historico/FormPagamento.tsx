'use client'

import { useState } from 'react'
import { registrarPagamento } from '@/backend/actions/pagamento'
import { PlusCircle } from 'lucide-react'

export function FormPagamento({ proximaParcela, prestacaoEstimada }: { proximaParcela: number, prestacaoEstimada: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [numero, setNumero] = useState(proximaParcela)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [valor, setValor] = useState(prestacaoEstimada.toFixed(2))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('numeroParcela', numero.toString())
      formData.append('dataPagamento', data)
      formData.append('valorPago', valor.toString())

      await registrarPagamento(formData)
      setSuccess(`Parcela ${numero} registrada com sucesso!`)
      setNumero(n => n + 1)
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle className="text-success" size={20} />
        <h3 className="font-semibold text-sm">Registrar Novo Pagamento</h3>
      </div>

      {error && <div className="text-danger text-sm mb-4 bg-danger/10 p-2 rounded border border-danger/20">{error}</div>}
      {success && <div className="text-success text-sm mb-4 bg-success/10 p-2 rounded border border-success/20">{success}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="form-group w-full sm:w-24">
          <label className="form-label text-xs uppercase text-muted">Parcela</label>
          <input
            type="number"
            className="form-input text-sm font-mono"
            value={numero}
            onChange={(e) => setNumero(Number(e.target.value))}
            min="1"
            max="360"
            required
          />
        </div>
        
        <div className="form-group w-full sm:w-40">
          <label className="form-label text-xs uppercase text-muted">Data</label>
          <input
            type="date"
            className="form-input text-sm"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>

        <div className="form-group w-full sm:w-40">
          <label className="form-label text-xs uppercase text-muted">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className="form-input text-sm font-mono"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto h-42 px-6">
          {loading ? 'Salvando...' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
