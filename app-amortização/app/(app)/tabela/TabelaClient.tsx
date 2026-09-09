'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatBRL } from '@/backend/lib/calculadora/price'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { DetalhesParcela } from './DetalhesParcela'

interface TabelaClientProps {
  tabela: any[]
  usarTR: boolean
  parcelaAtual: number
  financiamentoId: string
}

const columnHelper = createColumnHelper<any>()

export function TabelaClient({ tabela, usarTR, parcelaAtual }: TabelaClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedParcela, setSelectedParcela] = useState<any>(null)

  const handleToggleTR = () => {
    const params = new URLSearchParams(searchParams)
    if (usarTR) {
      params.set('comTR', 'false')
    } else {
      params.delete('comTR')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const columns = [
    columnHelper.accessor('parcela', {
      header: 'Mês',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('dataVencimento', {
      header: 'Vencimento',
      cell: info => format(new Date(info.getValue()), 'dd/MM/yyyy'),
    }),
    columnHelper.accessor('prestacao', {
      header: 'Prestação',
      cell: info => <span className="font-semibold">{formatBRL(info.getValue())}</span>,
    }),
    columnHelper.accessor('amortizacao', {
      header: 'Amortização',
      cell: info => formatBRL(info.getValue()),
    }),
    columnHelper.accessor('amortizacaoExtraValor', {
      header: 'Amort. Extra',
      cell: info => {
        const val = info.getValue()
        if (!val) return '-'
        const row = info.row.original
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-brand">{formatBRL(val)}</span>
            <span className="text-10px text-muted-foreground mt-0.5" title={row.amortizacaoExtraModalidade === 'REDUZ_PRAZO' ? 'Reduziu Prazo' : 'Reduziu Prestação'}>
              {row.amortizacaoExtraModalidade === 'REDUZ_PRAZO' ? 'Reduz. Prazo' : 'Reduz. Prest.'}
            </span>
          </div>
        )
      },
    }),
    columnHelper.accessor('juros', {
      header: 'Juros',
      cell: info => formatBRL(info.getValue()),
    }),
    columnHelper.accessor('seguro', {
      header: 'Seguro',
      cell: info => formatBRL(info.getValue()),
    }),
    columnHelper.accessor('correcaoTR', {
      header: 'TR',
      cell: info => {
        const val = info.getValue()
        return val > 0 ? <span className="text-danger">+{formatBRL(val)}</span> : '-'
      },
    }),
    columnHelper.accessor('saldoDevedor', {
      header: 'Saldo Devedor',
      cell: info => <span className="font-bold">{formatBRL(info.getValue())}</span>,
    }),
  ]

  const table = useReactTable({
    data: tabela,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 60, // Exibe 5 anos por página
      }
    }
  })

  // Para iniciar a página na página onde está a parcela atual
  useState(() => {
    if (parcelaAtual > 60) {
      const pageIndex = Math.floor((parcelaAtual - 1) / 60)
      table.setPageIndex(pageIndex)
    }
  })

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Tabela de Amortização (360 meses)</h1>
          <p className="section-sub">Acompanhe a composição de cada parcela do seu contrato.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={usarTR} 
              onChange={handleToggleTR}
              className="accent-brand"
            />
            <span className="text-sm font-medium">Aplicar TR Real</span>
          </label>
          <button className="btn btn-secondary btn-sm">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="card-sm p-0 overflow-hidden mb-6">
        <div className="table-container border-0 rounded-none">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => {
                const isPaga = row.original.parcela < parcelaAtual
                const isAtual = row.original.parcela === parcelaAtual
                return (
                  <tr 
                    key={row.id}
                    className={`${isPaga ? 'row-paga' : ''} ${isAtual ? 'row-atual' : ''} cursor-pointer hover:bg-hover transition-colors`}
                    onClick={() => setSelectedParcela(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        <div className="pagination border-t border-subtle bg-elevated rounded-b-md">
          <button 
            className="pagination-btn" 
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
          >
            ←
          </button>
          <span className="text-sm text-secondary px-4 font-medium">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <button 
            className="pagination-btn" 
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
          >
            →
          </button>
        </div>
      </div>

      {selectedParcela && (
        <DetalhesParcela 
          parcela={selectedParcela} 
          onClose={() => setSelectedParcela(null)} 
        />
      )}
    </div>
  )
}
