/**
 * Investimentos — Carteira com cotações em tempo real e análise de resultado.
 *
 * Fontes de dados:
 *  - Cotações (Ações/FIIs/ETFs): Brapi via proxy server-side /api/investimentos/cotacoes
 *  - CDI diário: Banco Central do Brasil via mesmo proxy (sem autenticação externa)
 */
import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, pct, fmtDate } from "../utils/format";
import { deleteRow } from "../utils/apiService";
import { useToast } from "../components/Toast";

const TIPO_COLOR = { FII: "#34d399", "Ação": "#4f9cf9", ETF: "#f59e0b", "Renda Fixa": "#a78bfa" };
const ATUALIZA_INTERVALO_MS = 5 * 60 * 1000; // atualiza a cada 5 minutos

// ── Hook de cotações ──────────────────────────────────────────────────────────
function useCotacoes(tickers) {
  const [estado, setEstado] = useState({
    cotacoes: {},
    cdiDiario: 0,
    cdiAnual: 0,
    loading: true,
    erro: null,
    atualizadoEm: null,
  });

  const buscar = useCallback(async () => {
    if (!tickers || tickers.length === 0) {
      setEstado(e => ({ ...e, loading: false }));
      return;
    }
    setEstado(e => ({ ...e, loading: true, erro: null }));
    try {
      const params = new URLSearchParams({ tickers: tickers.join(',') });
      const res = await fetch(`/api/investimentos/cotacoes?${params}`);
      const json = await res.json();
      if (json.success) {
        setEstado({
          cotacoes:     json.data.cotacoes     ?? {},
          cdiDiario:    json.data.cdiDiario    ?? 0,
          cdiAnual:     json.data.cdiAnual     ?? 0,
          loading:      false,
          erro:         null,
          atualizadoEm: json.data.atualizadoEm,
        });
      } else {
        throw new Error(json.error ?? 'Erro desconhecido');
      }
    } catch (err) {
      setEstado(e => ({ ...e, loading: false, erro: err.message, atualizadoEm: null }));
    }
  }, [tickers?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    buscar();
    const id = setInterval(buscar, ATUALIZA_INTERVALO_MS);
    return () => clearInterval(id);
  }, [buscar]);

  return { ...estado, refetch: buscar };
}

// ── Utilitários ───────────────────────────────────────────────────────────────
function fmtHora(isoStr) {
  if (!isoStr) return null;
  try {
    return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return null; }
}

function VarBadge({ valor }) {
  if (valor === null || valor === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const positivo = valor >= 0;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)',
      color: positivo ? '#34d399' : '#f87171',
    }}>
      {positivo ? '▲' : '▼'} {Math.abs(valor).toFixed(2)}%
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Investimentos({ data, onAdd, onEdit, refetch }) {
  const [toggling, setToggling] = useState(null);
  const { toast } = useToast();

  // Tickers negociáveis em bolsa (Renda Fixa não tem ticker Brapi)
  const tickersBolsa = data
    .filter(inv => inv.tipo !== 'Renda Fixa')
    .map(inv => (inv.ticker || inv.nome_ticker || '').toUpperCase())
    .filter(Boolean);

  const { cotacoes, cdiDiario, cdiAnual, loading, erro, atualizadoEm, refetch: refetchCotacoes } = useCotacoes(tickersBolsa);

  const handleDelete = async (item, idx) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${item.ticker}"?`)) return;
    setToggling(idx);
    try {
      await deleteRow("investimentos", { id: item.id });
      toast.success(`"${item.ticker}" foi excluído com sucesso.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  // Enriquece cada investimento com dados de cotação
  const enriched = data.map(inv => {
    const ticker = (inv.ticker || '').toUpperCase();
    const cot    = cotacoes[ticker];

    if (inv.tipo === 'Renda Fixa') {
      // Renda Fixa: usa preço médio como base + rendimento estimado via CDI
      const rentPct          = inv.rentabilidade_cdi ?? 100; // % do CDI (ex: 110)
      const taxaDia          = (cdiDiario * rentPct) / 100;  // taxa diária efetiva
      const diasDesdeCompra  = inv.data_compra
        ? Math.max(0, Math.floor((Date.now() - new Date(inv.data_compra).getTime()) / 86400000))
        : 0;
      const fatorAcum        = Math.pow(1 + taxaDia / 100, diasDesdeCompra);
      const valorAtual       = inv.preco_medio * inv.quantidade * fatorAcum;
      const resultado        = valorAtual - (inv.preco_medio * inv.quantidade);
      const rentabilidadeAno = ((rentPct / 100) * cdiAnual).toFixed(2);

      return {
        ...inv,
        precoAtual:        inv.preco_medio,
        varDia:            (cdiDiario * rentPct) / 100,
        valorTotal:        valorAtual,
        resultado,
        resultadoPct:      diasDesdeCompra > 0 ? (fatorAcum - 1) * 100 : 0,
        rentabilidadeInfo: `${rentPct}% CDI · ~${rentabilidadeAno}% a.a.`,
        temCotacao:        false,
      };
    }

    // Ação / FII / ETF
    const precoAtual  = cot?.preco ?? inv.preco_medio;
    const valorTotal  = inv.quantidade * precoAtual;
    const resultado   = (precoAtual - inv.preco_medio) * inv.quantidade;
    const resultadoPct = inv.preco_medio > 0 ? ((precoAtual - inv.preco_medio) / inv.preco_medio) * 100 : 0;

    return {
      ...inv,
      precoAtual,
      varDia:    cot?.varDia ?? null,
      valorTotal,
      resultado,
      resultadoPct,
      temCotacao: !!cot,
    };
  });

  const totalInvestido      = enriched.reduce((s, i) => s + (i.quantidade * i.preco_medio), 0);
  const totalAtual          = enriched.reduce((s, i) => s + i.valorTotal, 0);
  const resultadoTotal      = totalAtual - totalInvestido;
  const resultadoPctTotal   = totalInvestido > 0 ? (resultadoTotal / totalInvestido) * 100 : 0;

  const melhorAtivo = enriched
    .filter(i => i.varDia !== null)
    .sort((a, b) => (b.varDia ?? -Infinity) - (a.varDia ?? -Infinity))[0];

  const tipoData = Object.entries(
    enriched.reduce((acc, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + i.valorTotal; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const hora = fmtHora(atualizadoEm);

  return (
    <div className="flex flex-col gap-16">

      {/* KPIs */}
      <div className="grid-kpi">
        {[
          { label: "Patrimônio Total",    value: fmt(totalAtual),     color: "purple" },
          { label: "FIIs",               value: fmt(enriched.filter(i => i.tipo === "FII").reduce((s, i) => s + i.valorTotal, 0)),  color: "green" },
          { label: "Ações",              value: fmt(enriched.filter(i => i.tipo === "Ação").reduce((s, i) => s + i.valorTotal, 0)), color: "blue"  },
          { label: "Renda Fixa",         value: fmt(enriched.filter(i => i.tipo === "Renda Fixa").reduce((s, i) => s + i.valorTotal, 0)), color: "amber" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
          </div>
        ))}
      </div>

      {/* Resultado total + melhor ativo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: 200,
          background: resultadoTotal >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1.5px solid ${resultadoTotal >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          borderRadius: 14, padding: '14px 18px',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Resultado Total</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono)', color: resultadoTotal >= 0 ? '#34d399' : '#f87171' }}>
            {resultadoTotal >= 0 ? '+' : ''}{fmt(resultadoTotal)}
          </div>
          <div style={{ fontSize: 12, color: resultadoTotal >= 0 ? '#34d399' : '#f87171', opacity: 0.8, marginTop: 2 }}>
            {resultadoTotal >= 0 ? '▲' : '▼'} {Math.abs(resultadoPctTotal).toFixed(2)}% s/ custo
          </div>
        </div>

        {melhorAtivo && (
          <div style={{
            flex: 1, minWidth: 200,
            background: 'rgba(79,156,249,0.08)',
            border: '1.5px solid rgba(79,156,249,0.2)',
            borderRadius: 14, padding: '14px 18px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>⚡ Destaque do Dia</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{melhorAtivo.ticker}</div>
            <VarBadge valor={melhorAtivo.varDia} />
          </div>
        )}
      </div>

      {/* Tabela + Alocação */}
      <div className="grid-sidebar">
        <div className="card card--flat">
          <div className="tbl-header">
            <span className="tbl-header__title">Carteira de Investimentos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Indicador de status das cotações */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                {loading ? (
                  <span style={{ color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Atualizando...
                  </span>
                ) : erro ? (
                  <span style={{ color: '#f87171' }}>⚠️ Cotações offline</span>
                ) : hora ? (
                  <span style={{ color: 'var(--text-muted)' }}>⚡ Atualizado às {hora}</span>
                ) : null}
                {!loading && (
                  <button
                    onClick={refetchCotacoes}
                    title="Atualizar cotações"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6, padding: 0 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                  >
                    ↺
                  </button>
                )}
              </div>
              <button className="btn btn--green" onClick={onAdd}>+ Adicionar</button>
            </div>
          </div>

          <div className="tbl-wrap">
            {enriched.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">💼</div>
                <div className="empty-state__text">Nenhum investimento cadastrado.</div>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Ativo</th>
                    <th>Tipo</th>
                    <th>Qtd.</th>
                    <th>P. Médio</th>
                    <th>Cotação Atual</th>
                    <th>Var. Dia</th>
                    <th>Valor Total</th>
                    <th>Resultado</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((inv, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>{inv.ticker}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 10 }}>
                          {inv.tipo === 'Renda Fixa' ? inv.rentabilidadeInfo : inv.setor}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: (TIPO_COLOR[inv.tipo] || "#64748b") + "22", color: TIPO_COLOR[inv.tipo] || "#64748b" }}>
                          {inv.tipo}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{inv.quantidade}</td>
                      <td className="val val--muted">{fmt(inv.preco_medio)}</td>

                      {/* Cotação Atual */}
                      <td className="val val--primary">
                        {inv.tipo === 'Renda Fixa' ? (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>CDI</span>
                        ) : loading ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>...</span>
                        ) : inv.temCotacao ? (
                          fmt(inv.precoAtual)
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }} title="Cotação indisponível">—</span>
                        )}
                      </td>

                      {/* Var. Dia */}
                      <td>
                        {inv.tipo === 'Renda Fixa' ? (
                          <span style={{ fontSize: 11, color: '#a78bfa' }}>
                            {inv.rentabilidade_cdi}% CDI
                          </span>
                        ) : (
                          <VarBadge valor={inv.varDia} />
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="val val--primary">{fmt(inv.valorTotal)}</td>

                      {/* Resultado */}
                      <td>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: inv.resultado >= 0 ? '#34d399' : '#f87171' }}>
                          {inv.resultado >= 0 ? '+' : ''}{fmt(inv.resultado)}
                        </div>
                        <div style={{ fontSize: 10, color: inv.resultado >= 0 ? '#34d399' : '#f87171', opacity: 0.75 }}>
                          {inv.resultado >= 0 ? '▲' : '▼'} {Math.abs(inv.resultadoPct).toFixed(2)}%
                        </div>
                      </td>

                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmtDate(inv.data_compra)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => onEdit(inv)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={toggling === i}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(inv, i)}
                            title="Excluir"
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={toggling === i}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  <tr className="tbl__total">
                    <td colSpan={6}>TOTAL</td>
                    <td className="val val--primary">{fmt(totalAtual)}</td>
                    <td colSpan={3} style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: resultadoTotal >= 0 ? '#34d399' : '#f87171' }}>
                      {resultadoTotal >= 0 ? '+' : ''}{fmt(resultadoTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Alocação por tipo */}
        <div className="card">
          <div className="sec-header"><span className="sec-header__title">Alocação por Tipo</span></div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={tipoData} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                dataKey="value" paddingAngle={3}>
                {tipoData.map((e, i) => <Cell key={i} fill={TIPO_COLOR[e.name] || `hsl(${i * 60},65%,58%)`} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 12, boxShadow: "var(--shadow-1)" }} />
            </PieChart>
          </ResponsiveContainer>
          {tipoData.map((t, i) => (
            <div className="legend-item" key={i}>
              <div className="legend-item__left">
                <div className="legend-item__dot" style={{ background: TIPO_COLOR[t.name] || "#60a5fa" }} />
                <span className="legend-item__name">{t.name}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="legend-item__value">{pct(t.value, totalAtual)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{fmt(t.value)}</div>
              </div>
            </div>
          ))}

          {/* CDI de referência */}
          {cdiAnual > 0 && (
            <div style={{
              marginTop: 16,
              padding: '10px 12px',
              background: 'rgba(167,139,250,0.08)',
              border: '1.5px solid rgba(167,139,250,0.2)',
              borderRadius: 10,
              fontSize: 12,
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>🏦 CDI de Referência (BCB)</div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontFamily: 'var(--mono)' }}>
                {cdiAnual.toFixed(2)}% a.a.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
