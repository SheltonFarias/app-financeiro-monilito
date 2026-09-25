/**
 * Investimentos — Hub de investimentos estilo Investidor10.
 *
 * Abas:
 *  1. 💼 Carteira     — visão atual com % da carteira e badges de avaliação
 *  2. 📊 Análise      — ranking ordenável + drawer de ficha técnica por ativo
 *  3. 🔄 Comparador   — gráfico de barras comparando rentabilidade vs CDI
 *
 * Fontes de dados (sem mudanças no backend):
 *  - Cotações: Brapi via /api/investimentos/cotacoes
 *  - Histórico: /api/investimentos/cotacoes/historico?symbol=TICKER
 *  - CDI: Banco Central do Brasil (via mesma rota de cotações)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine,
  LineChart, Line,
} from "recharts";
import { fmt, pct, fmtDate } from "../utils/format";
import { deleteRow } from "../utils/apiService";
import { useToast } from "../components/Toast";

const TIPO_COLOR = { FII: "#34d399", "Ação": "#4f9cf9", ETF: "#f59e0b", "Renda Fixa": "#a78bfa" };
const ATUALIZA_INTERVALO_MS = 5 * 60 * 1000;

// ── Hook de cotações ──────────────────────────────────────────────────────────
function useCotacoes(tickers) {
  const [estado, setEstado] = useState({
    cotacoes: {}, cdiDiario: 0, cdiAnual: 0,
    loading: true, erro: null, atualizadoEm: null,
    requisicoesMes: 0, limiteMaximo: 15000,
    limiteMensalAtingido: false, dadosDesatualizados: false, fonteDados: null,
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
        const meta = json.meta ?? {};
        setEstado({
          cotacoes:             json.data.cotacoes     ?? {},
          cdiDiario:            json.data.cdiDiario    ?? 0,
          cdiAnual:             json.data.cdiAnual     ?? 0,
          loading:              false, erro: null,
          atualizadoEm:         json.data.atualizadoEm,
          requisicoesMes:       meta.requisicoesMes       ?? 0,
          limiteMaximo:         meta.limiteMaximo         ?? 15000,
          limiteMensalAtingido: meta.limiteMensalAtingido ?? false,
          dadosDesatualizados:  meta.dadosDesatualizados  ?? false,
          fonteDados:           meta.fonteDados           ?? null,
        });
      } else throw new Error(json.error ?? 'Erro desconhecido');
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

// ── Hook de histórico de cotações (para o drawer) ─────────────────────────────
function useHistorico(symbol) {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!symbol) { setHistorico([]); return; }
    setLoading(true);
    fetch(`/api/investimentos/cotacoes/historico?symbol=${symbol}&limit=30`)
      .then(r => r.json())
      .then(j => setHistorico(j.success ? (j.data.historico ?? []) : []))
      .catch(() => setHistorico([]))
      .finally(() => setLoading(false));
  }, [symbol]);

  return { historico, loading };
}

// ── Utilitários ───────────────────────────────────────────────────────────────
function fmtHora(isoStr) {
  if (!isoStr) return null;
  try { return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return null; }
}

function VarBadge({ valor }) {
  if (valor === null || valor === undefined)
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const pos = valor >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)', color: pos ? '#34d399' : '#f87171' }}>
      {pos ? '▲' : '▼'} {Math.abs(valor).toFixed(2)}%
    </span>
  );
}

/** Cálculo do Preço Justo Graham simplificado.
 *  Sem LPA/VPA (Brapi gratuito não fornece), usamos:
 *  PJ ≈ preço_médio × 0.75 como "piso conservador"
 *  e cotacaoAtual vs precoMedio como proxy de valuation relativo.
 *  Exibido sempre com disclaimer educativo.
 */
function calcGraham(inv) {
  const pm = inv.preco_medio;
  const pa = inv.precoAtual;
  if (!pm || pm <= 0) return { label: 'N/D', classe: 'nd', preco: null };
  // Heurística: se cotação atual < 85% do preço médio → "Barato" (relativamente ao seu histórico pessoal)
  // se entre 85%~115% → "Na faixa", se > 115% → "Acima do custo"
  const ratio = pa / pm;
  if (ratio < 0.85) return { label: '🟢 Abaixo do custo', classe: 'barato', preco: pa };
  if (ratio <= 1.15) return { label: '🟡 Perto do custo',  classe: 'justo',  preco: pa };
  return { label: '🔴 Acima do custo', classe: 'caro', preco: pa };
}

function GrahamBadge({ inv }) {
  const g = calcGraham(inv);
  return (
    <span className={`graham-badge graham-badge--${g.classe}`}>
      {g.label}
    </span>
  );
}

function RateLimitBar({ total, limite, atingido, desatualizado, atualizadoEm }) {
  const p   = Math.min(100, (total / limite) * 100);
  const cor = p >= 100 ? '#f87171' : p >= 80 ? '#fbbf24' : '#34d399';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>🔢 API Brapi</span>
        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700, color: cor }}>
          {total.toLocaleString('pt-BR')} / {limite.toLocaleString('pt-BR')} req/mês
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${p}%`, background: cor, borderRadius: 99, transition: 'width 0.4s ease', boxShadow: `0 0 6px ${cor}66` }} />
      </div>
      {(atingido || desatualizado) && (
        <div style={{ fontSize: 10, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
          ⚠️ Dados de {atualizadoEm
            ? new Date(atualizadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '—'} · limite mensal atingido
        </div>
      )}
    </div>
  );
}

// ── Drawer de Ficha Técnica ───────────────────────────────────────────────────
function DrawerFichaTecnica({ inv, totalAtual, cdiAnual, onClose }) {
  const { historico, loading: loadHist } = useHistorico(
    inv && inv.tipo !== 'Renda Fixa' ? inv.ticker : null
  );
  const overlayRef = useRef(null);

  // Fechar ao clicar no overlay
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ESC fecha
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!inv) return null;

  const pctCarteira = totalAtual > 0 ? (inv.valorTotal / totalAtual) * 100 : 0;
  const graham      = calcGraham(inv);
  const historicoFmt = historico
    .slice()
    .reverse()
    .map((h, i) => ({ i, preco: h.preco, data: h.cotacao_em ? new Date(h.cotacao_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '' }));

  return (
    <>
      <div className="drawer-overlay" ref={overlayRef} onClick={handleOverlayClick} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label={`Ficha: ${inv.ticker}`}>
        {/* Header */}
        <div className="drawer__header">
          <div>
            <div className="drawer__ticker">{inv.ticker}</div>
            <div className="drawer__nome">
              <span className="badge" style={{ background: (TIPO_COLOR[inv.tipo] || '#64748b') + '22', color: TIPO_COLOR[inv.tipo] || '#64748b', marginRight: 6 }}>{inv.tipo}</span>
              {inv.setor && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{inv.setor}</span>}
            </div>
          </div>
          <button className="drawer__close" onClick={onClose} title="Fechar">✕</button>
        </div>

        <div className="drawer__body">
          {/* Cotação em destaque */}
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 38, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {inv.tipo === 'Renda Fixa' ? '— CDI' : fmt(inv.precoAtual)}
            </div>
            {inv.tipo !== 'Renda Fixa' && (
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <VarBadge valor={inv.varDia} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>hoje</span>
                {inv.dyPct !== null && (
                  <span className="dy-badge">🏷 DY {inv.dyPct.toFixed(2)}% a.a.</span>
                )}
              </div>
            )}
          </div>

          {/* Mini Gráfico de Histórico */}
          {inv.tipo !== 'Renda Fixa' && (
            <div className="drawer__section">
              <div className="drawer__section-title">📈 Histórico Recente (últimos registros)</div>
              <div className="mini-chart-wrap">
                {loadHist ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>Carregando...</div>
                ) : historicoFmt.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={historicoFmt} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                      <Line type="monotone" dataKey="preco" stroke="#4f9cf9" strokeWidth={2} dot={false} />
                      <Tooltip
                        formatter={v => [fmt(v), 'Preço']}
                        labelFormatter={(_, p) => p?.[0]?.payload?.data ?? ''}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, fontSize: 11, boxShadow: 'var(--shadow-1)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 11 }}>
                    Histórico insuficiente — dados são acumulados a cada atualização
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Métricas principais */}
          <div className="drawer__section">
            <div className="drawer__section-title">📊 Indicadores da Posição</div>
            <div className="drawer__metrics">
              <div className="drawer__metric">
                <div className="drawer__metric-label">Preço Médio</div>
                <div className="drawer__metric-value">{fmt(inv.preco_medio)}</div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">Quantidade</div>
                <div className="drawer__metric-value" style={{ fontFamily: 'var(--mono)' }}>{inv.quantidade}</div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">Valor Investido</div>
                <div className="drawer__metric-value">{fmt(inv.preco_medio * inv.quantidade)}</div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">Valor Atual</div>
                <div className="drawer__metric-value" style={{ color: inv.resultado >= 0 ? '#34d399' : '#f87171' }}>
                  {fmt(inv.valorTotal)}
                </div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">Resultado R$</div>
                <div className="drawer__metric-value" style={{ color: inv.resultado >= 0 ? '#34d399' : '#f87171' }}>
                  {inv.resultado >= 0 ? '+' : ''}{fmt(inv.resultado)}
                </div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">Resultado %</div>
                <div className="drawer__metric-value" style={{ color: inv.resultado >= 0 ? '#34d399' : '#f87171' }}>
                  {inv.resultado >= 0 ? '▲' : '▼'} {Math.abs(inv.resultadoPct).toFixed(2)}%
                </div>
              </div>
              <div className="drawer__metric">
                <div className="drawer__metric-label">% da Carteira</div>
                <div className="drawer__metric-value" style={{ color: 'var(--text-primary)' }}>
                  {pctCarteira.toFixed(1)}%
                </div>
              </div>
              {inv.tipo !== 'Renda Fixa' && cdiAnual > 0 && (
                <div className="drawer__metric">
                  <div className="drawer__metric-label">Resultado vs CDI</div>
                  <div className="drawer__metric-value" style={{ color: inv.resultadoPct >= cdiAnual ? '#34d399' : '#f87171' }}>
                    {(inv.resultadoPct - cdiAnual).toFixed(2)}%
                  </div>
                  <div className="drawer__metric-sub">CDI anual: {cdiAnual.toFixed(2)}%</div>
                </div>
              )}
              {/* DY% — exibe quando dividendo_anual está cadastrado */}
              {inv.dyPct !== null && inv.dyPct !== undefined && (
                <div className="drawer__metric">
                  <div className="drawer__metric-label">🏷 Dividend Yield</div>
                  <div className="drawer__metric-value" style={{ color: '#fbbf24' }}>
                    {inv.dyPct.toFixed(2)}% a.a.
                  </div>
                  <div className="drawer__metric-sub">R$ {(inv.dividendo_anual || 0).toFixed(2)}/cota/ano</div>
                </div>
              )}
              {inv.tipo === 'Renda Fixa' && (
                <div className="drawer__metric">
                  <div className="drawer__metric-label">Rentabilidade</div>
                  <div className="drawer__metric-value" style={{ color: '#a78bfa', fontSize: 13 }}>
                    {inv.rentabilidadeInfo}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preço Justo (avaliação relativa) */}
          {inv.tipo !== 'Renda Fixa' && (
            <div className="drawer__section">
              <div className="drawer__section-title">⚖️ Avaliação Relativa (Graham Simplificado)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--hairline)' }}>
                <GrahamBadge inv={inv} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Cotação: {fmt(inv.precoAtual)} · P.Médio: {fmt(inv.preco_medio)}
                </span>
              </div>
              <div className="drawer__disclaimer">
                ⚠️ <strong>Avaliação educativa</strong> — comparação entre cotação atual e seu preço médio de compra. Para o Preço Justo Graham real (√22,5 × LPA × VPA), consulte plataformas com dados fundamentalistas completos.
              </div>
            </div>
          )}

          {/* Data de compra */}
          {inv.data_compra && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
              <span>Data de compra</span>
              <span style={{ fontFamily: 'var(--mono)' }}>{fmtDate(inv.data_compra)}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Aba 1: Carteira ──────────────────────────────────────────────────────────
function AbaCarteira({ enriched, totalAtual, totalInvestido, resultadoTotal, resultadoPctTotal, tipoData,
  loading, erro, hora, refetchCotacoes, requisicoesMes, limiteMaximo, limiteMensalAtingido,
  dadosDesatualizados, atualizadoEm, cdiAnual, onAdd, onEdit, onDelete, toggling, onSelectAtivo }) {

  const varDiaTotal = enriched
    .filter(i => i.temCotacao && i.varDia !== null)
    .reduce((acc, i) => acc + (i.varDia * i.valorTotal / 100), 0);

  return (
    <div className="flex flex-col gap-16">

      {/* ── Barra de status de cotações ───────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, flexWrap: 'wrap', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          {loading ? (
            <span style={{ color: 'var(--text-muted)' }}><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Atualizando cotações...</span>
          ) : erro ? (
            <span style={{ color: '#f87171' }}>⚠️ Cotações offline — dados podem estar desatualizados</span>
          ) : hora ? (
            <span style={{ color: 'var(--text-muted)' }}>⚡ Cotações atualizadas às <strong style={{ color: 'var(--text-secondary)' }}>{hora}</strong></span>
          ) : null}
          {!loading && (
            <button onClick={refetchCotacoes} title="Atualizar cotações"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6, padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>↺</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!loading && requisicoesMes > 0 && (
            <RateLimitBar total={requisicoesMes} limite={limiteMaximo} atingido={limiteMensalAtingido} desatualizado={dadosDesatualizados} atualizadoEm={atualizadoEm} />
          )}
          <button className="btn btn--green" onClick={onAdd}>+ Adicionar</button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────── */}
      <div className="grid-kpi">
        {[
          { label: "Patrimônio Total",  value: fmt(totalAtual),   color: "purple", icon: "💼" },
          { label: "FIIs",              value: fmt(enriched.filter(i => i.tipo === "FII").reduce((s, i) => s + i.valorTotal, 0)),       color: "green", icon: "🏢" },
          { label: "Ações",             value: fmt(enriched.filter(i => i.tipo === "Ação").reduce((s, i) => s + i.valorTotal, 0)),      color: "blue",  icon: "📈" },
          { label: "Renda Fixa",        value: fmt(enriched.filter(i => i.tipo === "Renda Fixa").reduce((s, i) => s + i.valorTotal, 0)), color: "amber", icon: "🏦" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{icon} {label}</div>
            <div className="kpi__value">{value}</div>
          </div>
        ))}
      </div>

      {/* ── Resultado + CDI + Variação do dia ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <div style={{ background: resultadoTotal >= 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1.5px solid ${resultadoTotal >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📊 Resultado Total</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: resultadoTotal >= 0 ? '#34d399' : '#f87171' }}>
            {resultadoTotal >= 0 ? '+' : ''}{fmt(resultadoTotal)}
          </div>
          <div style={{ fontSize: 12, color: resultadoTotal >= 0 ? '#34d399' : '#f87171', opacity: 0.85, marginTop: 3 }}>
            {resultadoTotal >= 0 ? '▲' : '▼'} {Math.abs(resultadoPctTotal).toFixed(2)}% s/ custo
          </div>
        </div>

        {!loading && enriched.some(i => i.temCotacao) && (
          <div style={{ background: varDiaTotal >= 0 ? 'rgba(79,156,249,0.08)' : 'rgba(248,113,113,0.08)', border: `1.5px solid ${varDiaTotal >= 0 ? 'rgba(79,156,249,0.25)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📅 Variação Hoje</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: varDiaTotal >= 0 ? '#4f9cf9' : '#f87171' }}>
              {varDiaTotal >= 0 ? '+' : ''}{fmt(varDiaTotal)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              em {enriched.filter(i => i.temCotacao).length} ativos com cotação
            </div>
          </div>
        )}

        {cdiAnual > 0 && (
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1.5px solid rgba(167,139,250,0.2)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>🏦 CDI Referência</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: '#a78bfa' }}>{cdiAnual.toFixed(2)}% a.a.</div>
            <div style={{ fontSize: 12, color: resultadoPctTotal >= cdiAnual ? '#34d399' : '#f87171', marginTop: 3 }}>
              Carteira: {resultadoPctTotal >= cdiAnual ? '▲ acima' : '▼ abaixo'} do CDI
            </div>
          </div>
        )}
      </div>

      {/* ── Cards de Ativos + Alocação ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* Cards de ativos */}
        <div>
          {enriched.length === 0 ? (
            <div className="card card--flat">
              <div className="empty-state">
                <div className="empty-state__icon">💼</div>
                <div className="empty-state__text">Nenhum investimento cadastrado.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {enriched.map((inv, i) => {
                const pctCart = totalAtual > 0 ? (inv.valorTotal / totalAtual) * 100 : 0;
                const corTipo = TIPO_COLOR[inv.tipo] || '#64748b';
                const positivo = inv.resultado >= 0;
                return (
                  <div key={i}
                    onClick={() => onSelectAtivo(inv)}
                    style={{
                      background: 'var(--surface)',
                      border: '1.5px solid rgba(255,255,255,0.07)',
                      borderRadius: 14,
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, transform 0.15s',
                      borderLeft: `3px solid ${corTipo}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = corTipo; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Linha 1: Ticker + Tipo + Variação do dia + Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15, letterSpacing: '-0.01em' }}>{inv.ticker}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 1 }}>
                            {inv.tipo === 'Renda Fixa' ? inv.rentabilidadeInfo : (inv.setor || '—')}
                          </div>
                        </div>
                        <span className="badge" style={{ background: corTipo + '22', color: corTipo, fontSize: 10, padding: '2px 8px' }}>{inv.tipo}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {inv.tipo !== 'Renda Fixa' && inv.varDia !== null && inv.varDia !== undefined && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Hoje</div>
                            <VarBadge valor={inv.varDia} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={e => { e.stopPropagation(); onEdit(inv); }}
                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, padding: '5px 8px', opacity: 0.8 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                            disabled={toggling === i}>✏️</button>
                          <button onClick={e => { e.stopPropagation(); onDelete(inv, i); }}
                            style={{ background: 'rgba(248,113,113,0.08)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, padding: '5px 8px', opacity: 0.8 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                            disabled={toggling === i}>🗑️</button>
                        </div>
                      </div>
                    </div>

                    {/* Linha 2: Métricas em grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Qtd.</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{inv.quantidade}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>P. Médio</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>{fmt(inv.preco_medio)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Cotação</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>
                          {inv.tipo === 'Renda Fixa' ? <span style={{ fontSize: 11, color: '#a78bfa' }}>CDI</span>
                            : loading ? '...'
                            : inv.temCotacao ? fmt(inv.precoAtual)
                            : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Valor Total</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{fmt(inv.valorTotal)}</div>
                      </div>
                      <div style={{ background: positivo ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Resultado</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: positivo ? '#34d399' : '#f87171', fontFamily: 'var(--mono)' }}>
                          {positivo ? '+' : ''}{fmt(inv.resultado)}
                        </div>
                        <div style={{ fontSize: 10, color: positivo ? '#34d399' : '#f87171', opacity: 0.8, marginTop: 1 }}>
                          {positivo ? '▲' : '▼'} {Math.abs(inv.resultadoPct).toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    {/* Linha 3: Barra de % carteira + badge avaliação + DY */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>% da Carteira</span>
                          <span style={{ fontWeight: 700, color: corTipo }}>{pctCart.toFixed(1)}%</span>
                        </div>
                        <div className="pct-bar-track" style={{ height: 5 }}>
                          <div className="pct-bar-fill" style={{ width: `${Math.min(100, pctCart)}%`, background: corTipo }} />
                        </div>
                      </div>
                      {inv.tipo !== 'Renda Fixa' && <GrahamBadge inv={inv} />}
                      {inv.dyPct != null && (
                        <span className="dy-badge" style={{ fontSize: 10 }}>🏷 DY {inv.dyPct.toFixed(2)}%</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Linha de totais */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL DA CARTEIRA</span>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Valor Atual</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{fmt(totalAtual)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Resultado</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: resultadoTotal >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--mono)' }}>
                      {resultadoTotal >= 0 ? '+' : ''}{fmt(resultadoTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alocação por tipo (sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Alocação por Tipo</div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={tipoData} cx="50%" cy="50%" innerRadius={40} outerRadius={64} dataKey="value" paddingAngle={3}>
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
          </div>

          {/* Mini resumo de contagem */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Resumo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Ativos na carteira</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{enriched.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Total investido</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{fmt(totalInvestido)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Rentabilidade</span>
                <span style={{ fontWeight: 700, color: resultadoPctTotal >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--mono)' }}>
                  {resultadoPctTotal >= 0 ? '+' : ''}{resultadoPctTotal.toFixed(2)}%
                </span>
              </div>
              {cdiAnual > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>vs CDI ({cdiAnual.toFixed(2)}%)</span>
                  <span style={{ fontWeight: 700, color: resultadoPctTotal >= cdiAnual ? '#34d399' : '#f87171', fontFamily: 'var(--mono)' }}>
                    {(resultadoPctTotal - cdiAnual) >= 0 ? '+' : ''}{(resultadoPctTotal - cdiAnual).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Aba 2: Análise & Rankings ─────────────────────────────────────────────────
const SORT_OPTS = [
  { key: 'resultadoPct', label: 'Resultado %' },
  { key: 'varDia',       label: 'Var. Dia %'  },
  { key: 'valorTotal',   label: 'Posição R$'  },
  { key: 'pctCarteira',  label: '% Carteira'  },
  { key: 'resultado',    label: 'Resultado R$' },
];

function AbaAnalise({ enriched, totalAtual, cdiAnual, onSelectAtivo }) {
  const [sortKey, setSortKey] = useState('valorTotal');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const enrichedWithPct = enriched.map(inv => ({
    ...inv,
    pctCarteira: totalAtual > 0 ? (inv.valorTotal / totalAtual) * 100 : 0,
  }));

  const sorted = [...enrichedWithPct].sort((a, b) => {
    const va = a[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
    const vb = b[sortKey] ?? (sortDir === 'desc' ? -Infinity : Infinity);
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  // Cards de destaque (apenas ativos com cotação em bolsa)
  const bolsa = enriched.filter(i => i.temCotacao && i.varDia !== null);
  const top3  = [...bolsa].sort((a, b) => (b.varDia ?? -Infinity) - (a.varDia ?? -Infinity)).slice(0, 3);
  const bot3  = [...bolsa].sort((a, b) => (a.varDia ?? Infinity) - (b.varDia ?? Infinity)).slice(0, 3);

  const SortTh = ({ sKey, label }) => (
    <th className={sortKey === sKey ? 'sort-active' : ''} onClick={() => handleSort(sKey)}>
      {label}
      <span className={`sort-icon${sortKey === sKey ? ' sort-icon--active' : ''}`}>
        {sortKey === sKey ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ' ⇅'}
      </span>
    </th>
  );

  const rankBadgeClass = (i) => i === 0 ? 'rank-badge--gold' : i === 1 ? 'rank-badge--silver' : i === 2 ? 'rank-badge--bronze' : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cards de destaque */}
      {bolsa.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Melhores */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
              🔥 Melhores do Dia
            </div>
            <div className="highlight-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {top3.map(inv => (
                <div key={inv.ticker} className={`highlight-card highlight-card--${(inv.varDia ?? 0) >= 0 ? 'up' : 'down'}`}
                  onClick={() => onSelectAtivo(inv)} style={{ cursor: 'pointer' }}>
                  <div className="highlight-card__label">📈 Alta</div>
                  <div className="highlight-card__ticker">{inv.ticker}</div>
                  <div className="highlight-card__var" style={{ color: (inv.varDia ?? 0) >= 0 ? '#34d399' : '#f87171' }}>
                    {(inv.varDia ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(inv.varDia ?? 0).toFixed(2)}%
                  </div>
                  <div className="highlight-card__sub">{fmt(inv.precoAtual)}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Piores */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
              ❄️ Piores do Dia
            </div>
            <div className="highlight-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
              {bot3.map(inv => (
                <div key={inv.ticker} className="highlight-card highlight-card--down"
                  onClick={() => onSelectAtivo(inv)} style={{ cursor: 'pointer' }}>
                  <div className="highlight-card__label">📉 Queda</div>
                  <div className="highlight-card__ticker">{inv.ticker}</div>
                  <div className="highlight-card__var" style={{ color: '#f87171' }}>
                    ▼ {Math.abs(inv.varDia ?? 0).toFixed(2)}%
                  </div>
                  <div className="highlight-card__sub">{fmt(inv.precoAtual)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="card card--flat">
        <div className="tbl-header">
          <span className="tbl-header__title">🏆 Ranking de Ativos</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SORT_OPTS.map(o => (
              <button key={o.key}
                onClick={() => handleSort(o.key)}
                style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 99,
                  border: sortKey === o.key ? '1.5px solid var(--primary)' : '1.5px solid var(--hairline)',
                  background: sortKey === o.key ? 'rgba(0,117,222,0.15)' : 'transparent',
                  color: sortKey === o.key ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font)',
                }}>
                {o.label} {sortKey === o.key ? (sortDir === 'desc' ? '▼' : '▲') : ''}
              </button>
            ))}
          </div>
        </div>
        <div className="tbl-wrap">
          {sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🏆</div>
              <div className="empty-state__text">Nenhum ativo para rankear.</div>
            </div>
          ) : (
            <table className="ranking-tbl">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Ativo</th>
                  <th>Tipo</th>
                  <SortTh sKey="valorTotal"   label="Posição R$" />
                  <SortTh sKey="pctCarteira"  label="% Cart." />
                  <SortTh sKey="resultadoPct" label="Result. %" />
                  <SortTh sKey="varDia"       label="Var. Dia" />
                  <SortTh sKey="dyPct"        label="DY %" />
                  <th>Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inv, i) => (
                  <tr key={inv.ticker} onClick={() => onSelectAtivo(inv)}>
                    <td>
                      <span className={`rank-badge ${rankBadgeClass(i)}`}>{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{inv.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{inv.setor ?? inv.tipo}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: (TIPO_COLOR[inv.tipo] || '#64748b') + '22', color: TIPO_COLOR[inv.tipo] || '#64748b' }}>
                        {inv.tipo}
                      </span>
                    </td>
                    <td className="val val--primary">{fmt(inv.valorTotal)}</td>
                    <td>
                      <div className="pct-bar-wrap">
                        <div className="pct-bar-track">
                          <div className="pct-bar-fill" style={{ width: `${Math.min(100, inv.pctCarteira)}%`, background: TIPO_COLOR[inv.tipo] || '#64748b' }} />
                        </div>
                        <span className="pct-bar-label">{inv.pctCarteira.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: inv.resultadoPct >= 0 ? '#34d399' : '#f87171' }}>
                        {inv.resultadoPct >= 0 ? '▲' : '▼'} {Math.abs(inv.resultadoPct).toFixed(2)}%
                      </span>
                    </td>
                    <td><VarBadge valor={inv.varDia} /></td>
                    <td>
                      {inv.dyPct !== null ? (
                        <span className="dy-badge">{inv.dyPct.toFixed(1)}%</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td>{inv.tipo !== 'Renda Fixa' ? <GrahamBadge inv={inv} /> : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Aba 3: Comparador ─────────────────────────────────────────────────────────
const CUSTOM_TOOLTIP_COMP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'var(--mono)' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) + '%' : p.value}
        </div>
      ))}
    </div>
  );
};

function AbaComparador({ enriched, cdiAnual }) {
  const bolsa = enriched.filter(i => i.tipo !== 'Renda Fixa' && i.resultadoPct !== null);
  const rf    = enriched.filter(i => i.tipo === 'Renda Fixa');

  const dataBarras = bolsa
    .sort((a, b) => b.resultadoPct - a.resultadoPct)
    .map(inv => ({
      ticker: inv.ticker,
      'Resultado %': parseFloat(inv.resultadoPct.toFixed(2)),
      tipo: inv.tipo,
      fill: inv.resultadoPct >= 0 ? '#4f9cf9' : '#f87171',
    }));

  return (
    <div className="comparador-wrap">
      {/* Legenda */}
      <div className="comparador-legend">
        <div className="comparador-legend__item">
          <div className="comparador-legend__dot" style={{ background: '#4f9cf9' }} />
          <span>Resultado positivo</span>
        </div>
        <div className="comparador-legend__item">
          <div className="comparador-legend__dot" style={{ background: '#f87171' }} />
          <span>Resultado negativo</span>
        </div>
        {cdiAnual > 0 && (
          <div className="comparador-legend__item">
            <div className="comparador-legend__dot" style={{ background: '#a78bfa', borderRadius: 1 }} />
            <span>CDI anual ({cdiAnual.toFixed(2)}%)</span>
          </div>
        )}
      </div>

      {/* Gráfico de barras — Renda Variável */}
      {dataBarras.length > 0 ? (
        <div className="card card--flat">
          <div className="tbl-header">
            <span className="tbl-header__title">📊 Rentabilidade por Ativo (Renda Variável)</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Resultado % desde a compra vs CDI</span>
          </div>
          <div style={{ padding: '8px 20px 16px' }}>
            <ResponsiveContainer width="100%" height={Math.max(180, dataBarras.length * 44 + 40)}>
              <BarChart data={dataBarras} layout="vertical" margin={{ top: 4, right: 60, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={{ stroke: 'var(--hairline)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="ticker"
                  tick={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-primary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                {cdiAnual > 0 && (
                  <ReferenceLine x={cdiAnual} stroke="#a78bfa" strokeDasharray="5 4" strokeWidth={1.5}
                    label={{ value: `CDI ${cdiAnual.toFixed(1)}%`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 10, fontWeight: 700 }} />
                )}
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <Tooltip content={<CUSTOM_TOOLTIP_COMP />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="Resultado %" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {dataBarras.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="card card--flat">
          <div className="empty-state" style={{ minHeight: 120 }}>
            <div className="empty-state__icon">📊</div>
            <div className="empty-state__text">Adicione ativos de renda variável para comparar.</div>
          </div>
        </div>
      )}

      {/* Tabela de Renda Fixa com CDI */}
      {rf.length > 0 && (
        <div className="card card--flat">
          <div className="tbl-header">
            <span className="tbl-header__title">🏦 Renda Fixa vs CDI</span>
          </div>
          <div className="tbl-wrap">
            <table className="ranking-tbl">
              <thead>
                <tr>
                  <th>Ativo</th>
                  <th>% do CDI</th>
                  <th>Taxa Efetiva Est.</th>
                  <th>Resultado Acum.</th>
                  <th>Valor Atual</th>
                </tr>
              </thead>
              <tbody>
                {rf.map((inv, i) => {
                  const taxaEfetiva = cdiAnual > 0 ? ((inv.rentabilidade_cdi ?? 100) / 100 * cdiAnual).toFixed(2) : '—';
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{inv.ticker}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{fmtDate(inv.data_compra)}</div>
                      </td>
                      <td>
                        <span className="dy-badge">{inv.rentabilidade_cdi}% CDI</span>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>
                        ~{taxaEfetiva}% a.a.
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: inv.resultado >= 0 ? '#34d399' : '#f87171' }}>
                          {inv.resultado >= 0 ? '+' : ''}{fmt(inv.resultado)}
                        </span>
                      </td>
                      <td className="val val--primary">{fmt(inv.valorTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Investimentos({ data, onAdd, onEdit, refetch }) {
  const [tab,          setTab]          = useState(0);
  const [ativoSel,     setAtivoSel]     = useState(null);
  const [toggling,     setToggling]     = useState(null);
  const { toast } = useToast();

  const tickersBolsa = data
    .filter(inv => inv.tipo !== 'Renda Fixa')
    .map(inv => (inv.ticker || inv.nome_ticker || '').toUpperCase())
    .filter(Boolean);

  const {
    cotacoes, cdiDiario, cdiAnual, loading, erro, atualizadoEm,
    requisicoesMes, limiteMaximo, limiteMensalAtingido, dadosDesatualizados,
    refetch: refetchCotacoes,
  } = useCotacoes(tickersBolsa);

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

  // Enriquece dados com cotações e cálculos
  const enriched = data.map(inv => {
    const ticker = (inv.ticker || '').toUpperCase();
    const cot    = cotacoes[ticker];

    if (inv.tipo === 'Renda Fixa') {
      const rentPct         = inv.rentabilidade_cdi ?? 100;
      const taxaDia         = (cdiDiario * rentPct) / 100;
      const diasDesdeCompra = inv.data_compra
        ? Math.max(0, Math.floor((Date.now() - new Date(inv.data_compra).getTime()) / 86400000))
        : 0;
      const fatorAcum    = Math.pow(1 + taxaDia / 100, diasDesdeCompra);
      const valorAtual   = inv.preco_medio * inv.quantidade * fatorAcum;
      const resultado    = valorAtual - (inv.preco_medio * inv.quantidade);
      const rentAnual    = ((rentPct / 100) * cdiAnual).toFixed(2);

      return {
        ...inv,
        precoAtual:        inv.preco_medio,
        varDia:            (cdiDiario * rentPct) / 100,
        valorTotal:        valorAtual,
        resultado,
        resultadoPct:      diasDesdeCompra > 0 ? (fatorAcum - 1) * 100 : 0,
        rentabilidadeInfo: `${rentPct}% CDI · ~${rentAnual}% a.a.`,
        temCotacao:        false,
      };
    }

    const precoAtual   = cot?.preco ?? inv.preco_medio;
    const valorTotal   = inv.quantidade * precoAtual;
    const resultado    = (precoAtual - inv.preco_medio) * inv.quantidade;
    const resultadoPct = inv.preco_medio > 0 ? ((precoAtual - inv.preco_medio) / inv.preco_medio) * 100 : 0;

    return {
        ...inv,
        precoAtual,
        varDia:          cot?.varDia ?? null,
        valorTotal,
        resultado,
        resultadoPct,
        temCotacao:      !!cot,
        dyPct:           (inv.dividendo_anual && precoAtual > 0) ? (inv.dividendo_anual / precoAtual) * 100 : null,
      };
  });

  const totalInvestido    = enriched.reduce((s, i) => s + (i.quantidade * i.preco_medio), 0);
  const totalAtual        = enriched.reduce((s, i) => s + i.valorTotal, 0);
  const resultadoTotal    = totalAtual - totalInvestido;
  const resultadoPctTotal = totalInvestido > 0 ? (resultadoTotal / totalInvestido) * 100 : 0;

  const tipoData = Object.entries(
    enriched.reduce((acc, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + i.valorTotal; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const hora = fmtHora(atualizadoEm);

  const ABAS = [
    { icon: '💼', label: 'Carteira'  },
    { icon: '📊', label: 'Análise & Rankings' },
    { icon: '🔄', label: 'Comparador' },
  ];

  const sharedProps = { enriched, totalAtual, totalInvestido, resultadoTotal, resultadoPctTotal, cdiAnual, cdiDiario };

  return (
    <div className="flex flex-col gap-16">
      {/* Sistema de Abas */}
      <div className="inv-tabs">
        {ABAS.map((a, i) => (
          <button key={i} className={`inv-tab${tab === i ? ' inv-tab--active' : ''}`} onClick={() => setTab(i)}>
            <span className="inv-tab__icon">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba 0: Carteira */}
      {tab === 0 && (
        <AbaCarteira
          {...sharedProps}
          tipoData={tipoData}
          loading={loading} erro={erro} hora={hora}
          refetchCotacoes={refetchCotacoes}
          requisicoesMes={requisicoesMes} limiteMaximo={limiteMaximo}
          limiteMensalAtingido={limiteMensalAtingido}
          dadosDesatualizados={dadosDesatualizados} atualizadoEm={atualizadoEm}
          onAdd={onAdd} onEdit={onEdit}
          onDelete={handleDelete} toggling={toggling}
          onSelectAtivo={setAtivoSel}
        />
      )}

      {/* Aba 1: Análise */}
      {tab === 1 && (
        <AbaAnalise
          {...sharedProps}
          onSelectAtivo={setAtivoSel}
        />
      )}

      {/* Aba 2: Comparador */}
      {tab === 2 && (
        <AbaComparador
          enriched={enriched}
          cdiAnual={cdiAnual}
        />
      )}

      {/* Drawer de Ficha Técnica */}
      {ativoSel && (
        <DrawerFichaTecnica
          inv={ativoSel}
          totalAtual={totalAtual}
          cdiAnual={cdiAnual}
          onClose={() => setAtivoSel(null)}
        />
      )}
    </div>
  );
}
