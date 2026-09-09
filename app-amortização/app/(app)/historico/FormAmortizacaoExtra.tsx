'use client'

import { useState } from 'react'
import { registrarAmortizacaoExtra, editarAmortizacaoExtra } from '@/backend/actions/amortizacao'
import { PlusCircle, Save, XCircle, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function FormAmortizacaoExtra({ 
  proximaParcela,
  amortizacaoEmEdicao 
}: { 
  proximaParcela: number,
  amortizacaoEmEdicao?: any
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      if (amortizacaoEmEdicao) {
        await editarAmortizacaoExtra(amortizacaoEmEdicao.id, formData)
        router.push('/historico')
      } else {
        await registrarAmortizacaoExtra(formData)
        e.currentTarget.reset()
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCancelEdit() {
    router.push('/historico')
  }

  return (
    <form onSubmit={handleSubmit} className={`card mb-6 ${amortizacaoEmEdicao ? 'border-brand shadow-brand-glow' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {amortizacaoEmEdicao ? <Edit2 className="text-brand" size={20} /> : <PlusCircle className="text-brand" size={20} />}
          <h3 className="font-semibold text-sm">
            {amortizacaoEmEdicao ? 'Editar Amortização Extra' : 'Registrar Amortização Extra'}
          </h3>
        </div>
        {amortizacaoEmEdicao && (
          <button type="button" onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground">
            <XCircle size={20} />
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="form-group">
          <label className="form-label text-xs uppercase text-muted">Mês/Parcela de Ref.</label>
          <input
            type="number"
            name="parcelaReferencia"
            required
            min="1"
            defaultValue={amortizacaoEmEdicao ? amortizacaoEmEdicao.parcelaReferencia : proximaParcela}
            className="form-input text-sm font-mono"
          />
        </div>

        <div className="form-group">
          <label className="form-label text-xs uppercase text-muted">Data do Pagamento</label>
          <input
            type="date"
            name="dataPagamento"
            required
            defaultValue={amortizacaoEmEdicao ? new Date(amortizacaoEmEdicao.dataPagamento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
            className="form-input text-sm font-mono"
          />
        </div>

        <div className="form-group">
          <label className="form-label text-xs uppercase text-muted">Valor (R$)</label>
          <input
            type="number"
            name="valor"
            step="0.01"
            required
            placeholder="Ex: 5000.00"
            defaultValue={amortizacaoEmEdicao ? amortizacaoEmEdicao.valor : undefined}
            className="form-input text-sm font-mono"
          />
        </div>

        <div className="form-group">
          <label className="form-label text-xs uppercase text-muted">Modalidade</label>
          <select
            name="modalidade"
            required
            defaultValue={amortizacaoEmEdicao ? amortizacaoEmEdicao.modalidade : 'REDUZ_PRAZO'}
            className="form-input text-sm"
          >
            <option value="REDUZ_PRAZO">Reduzir Prazo</option>
            <option value="REDUZ_PRESTACAO">Reduzir Prestação</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        {amortizacaoEmEdicao && (
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={loading}
            className="btn btn-secondary mr-2"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {amortizacaoEmEdicao ? <Save size={16} /> : <PlusCircle size={16} />}
          {loading ? 'Salvando...' : amortizacaoEmEdicao ? 'Salvar Alterações' : 'Registrar Amortização'}
        </button>
      </div>
    </form>
  )
}
