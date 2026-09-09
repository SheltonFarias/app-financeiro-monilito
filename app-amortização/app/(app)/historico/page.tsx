import { redirect } from 'next/navigation'
import { auth } from '@/backend/auth'
import { prisma } from '@/backend/lib/prisma'
import { formatBRL } from '@/backend/lib/calculadora/price'
import { format } from 'date-fns'
import { FormPagamento } from './FormPagamento'
import { FormAmortizacaoExtra } from './FormAmortizacaoExtra'
import { AcoesAmortizacao } from './AcoesAmortizacao'

export default async function HistoricoPage({
  searchParams
}: {
  searchParams: Promise<{ editAmortizacao?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const session = await auth()
  if (!session?.user) redirect('/login')

  const financiamento = await prisma.financiamento.findFirst({
    where: { userId: session.user.id },
    include: {
      parcelasPagas: {
        orderBy: { numeroParcela: 'desc' },
      },
      amortizacoesExtras: {
        orderBy: { dataPagamento: 'desc' },
      },
    },
  })

  if (!financiamento) {
    return <div>Financiamento não encontrado</div>
  }

  const amortizacaoEmEdicao = resolvedSearchParams.editAmortizacao 
    ? financiamento.amortizacoesExtras.find(a => a.id === resolvedSearchParams.editAmortizacao)
    : undefined

  const pagas = financiamento.parcelasPagas
  const ultimaPaga = pagas[0]
  const prestacaoAprox = ultimaPaga ? ultimaPaga.valorPago : financiamento.totalMensalInicial

  return (
    <div className="animate-fadeIn">
      <div className="section-header">
        <div>
          <h1 className="section-title">Histórico de Pagamentos</h1>
          <p className="section-sub">Todas as suas {pagas.length} parcelas já pagas liquidadas.</p>
        </div>
      </div>

      <FormPagamento proximaParcela={financiamento.parcelaAtual} prestacaoEstimada={prestacaoAprox} />

      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 rounded-none">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Vencimento</th>
                <th>Data Pagamento</th>
                <th>Valor Pago</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagas.map((p) => (
                <tr key={p.id}>
                  <td>{p.numeroParcela}</td>
                  <td>{format(p.dataVencimento, 'dd/MM/yyyy')}</td>
                  <td>{p.dataPagamentoReal ? format(p.dataPagamentoReal, 'dd/MM/yyyy') : '-'}</td>
                  <td className="font-semibold text-success">{formatBRL(p.valorPago)}</td>
                  <td>
                    <span className="badge badge-success">Liquidado</span>
                  </td>
                </tr>
              ))}
              {pagas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    Nenhum pagamento registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-header mt-12">
        <div>
          <h2 className="section-title">Amortizações Extras</h2>
          <p className="section-sub">Aportes extraordinários realizados para reduzir saldo devedor.</p>
        </div>
      </div>

      <FormAmortizacaoExtra 
        proximaParcela={financiamento.parcelaAtual} 
        amortizacaoEmEdicao={amortizacaoEmEdicao}
      />

      <div className="card p-0 overflow-hidden">
        <div className="table-container border-0 rounded-none">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Ref. Parcela</th>
                <th>Data Pagamento</th>
                <th>Modalidade</th>
                <th>Valor Pago</th>
                <th className="w-24 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {financiamento.amortizacoesExtras.map((a) => (
                <tr key={a.id}>
                  <td>{a.parcelaReferencia}</td>
                  <td>{format(a.dataPagamento, 'dd/MM/yyyy')}</td>
                  <td>
                    <span className={`badge ${a.modalidade === 'REDUZ_PRAZO' ? 'bg-brand/10 text-brand' : 'bg-amber-500/10 text-amber-500'}`}>
                      {a.modalidade === 'REDUZ_PRAZO' ? 'Reduziu Prazo' : 'Reduziu Prestação'}
                    </span>
                  </td>
                  <td className="font-semibold text-brand">{formatBRL(a.valor)}</td>
                  <td className="text-right">
                    <AcoesAmortizacao id={a.id} />
                  </td>
                </tr>
              ))}
              {financiamento.amortizacoesExtras.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">
                    Nenhuma amortização extra registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
