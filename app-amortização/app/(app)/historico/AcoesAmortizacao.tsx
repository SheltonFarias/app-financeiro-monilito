'use client'

import { useState } from 'react'
import { excluirAmortizacaoExtra } from '@/backend/actions/amortizacao'
import { Trash2, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AcoesAmortizacao({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir esta amortização extra?')) return
    
    setLoading(true)
    try {
      await excluirAmortizacaoExtra(id)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleEditar() {
    router.push(`?editAmortizacao=${id}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleEditar} 
        disabled={loading}
        className="p-2 text-muted-foreground hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
        title="Editar"
      >
        <Edit2 size={16} />
      </button>
      <button 
        onClick={handleExcluir} 
        disabled={loading}
        className="p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
        title="Excluir"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
