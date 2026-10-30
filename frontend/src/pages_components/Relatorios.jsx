import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { fmt, COLORS } from "../utils/format";
import { apiFetch, apiUrl } from "../utils/apiService";

// ─── Meses disponíveis para seletor de comparação ────────────────────────────

const MESES_LABEL = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--hairline)",
      borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 12,
      boxShadow: "var(--shadow-1)"
    }}>
      <div style={{ color: "var(--ink-secondary)", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

/** Abrevia o nome do mês, ex: "Julho2026" → "Jul/26" */
function abreviarMes(m) {
  return m.replace(/([A-Za-zÀ-ú]+)(\d{4})/, (_, nome, ano) =>
    nome.substring(0, 3) + "/" + ano.slice(2)
  );
}

const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
const percentual = (parte, total) => total > 0 ? (parte / total) * 100 : 0;

function criarVisaoFinanceira(projecao, historico, categorias, mesAtual) {
  const atual = historico.find((item) => item.mes === mesAtual) ?? historico.at(-1) ?? {
    receita: 0, gastos_fixos: 0, gastos_variaveis: 0, gastos_totais: 0, saldo: 0,
  };
  const anterior = historico.filter((item) => item.mes !== atual.mes).at(-1);
  const taxaPoupanca = percentual(atual.saldo, atual.receita);
  const comprometimentoFixo = percentual(atual.gastos_fixos, atual.receita);
  const variacaoSaldo = anterior ? atual.saldo - anterior.saldo : null;
  const maiorCategoria = categorias[0];
  const primeiroSaldoNegativo = projecao.find((item) => item.saldo < 0);
  const fluxoRecorrente = projecao[1]?.fluxo_recorrente ?? 0;
  const receitaRecorrente = projecao[1]?.receita_recorrente ?? 0;
  const pontoEquilibrio = projecao[1] ? (projecao[1].gastos_fixos + projecao[1].gastos_variaveis_recorrentes) : 0;
  const lacunaRecorrente = Math.max(0, pontoEquilibrio - receitaRecorrente);
  const indice = limitar(Math.round(
    55 + taxaPoupanca * 1.4 - comprometimentoFixo * 0.45 - (atual.gastos_totais > atual.receita ? 20 : 0)
  ), 0, 100);
  const classificacao = indice >= 75 ? 'Sólida' : indice >= 50 ? 'Em atenção' : 'Pressionada';
  const cor = indice >= 75 ? 'var(--teal)' : indice >= 50 ? '#f59e0b' : '#ef4444';
  const cenarios = projecao.map((item, indiceMes) => ({
    ...item,
    conservador: item.saldo - atual.gastos_totais * 0.1 * indiceMes,
    base: item.saldo,
    otimista: item.saldo + atual.receita * 0.05 * indiceMes,
  }));

  const prioridades = [];
  if (atual.receita <= 0) prioridades.push('Registre receitas para que as projeções representem sua capacidade real de pagamento.');
  if (comprometimentoFixo > 60) prioridades.push(`Os gastos fixos consomem ${comprometimentoFixo.toFixed(0)}% da receita; reveja contratos e parcelas antes de assumir novas obrigações.`);
  if (taxaPoupanca < 10 && atual.receita > 0) prioridades.push(`A margem mensal está em ${taxaPoupanca.toFixed(0)}%; priorize criar folga no orçamento antes de aumentar aportes ou crédito.`);
  if (maiorCategoria && percentual(maiorCategoria.value, atual.gastos_totais) > 30) prioridades.push(`${maiorCategoria.name} concentra ${percentual(maiorCategoria.value, atual.gastos_totais).toFixed(0)}% dos gastos; acompanhe essa categoria semanalmente.`);
  if (primeiroSaldoNegativo) prioridades.push(`No cenário-base, o saldo projetado fica negativo em ${primeiroSaldoNegativo.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, '$1 $2')}; antecipe ajustes antes desse período.`);
  if (!prioridades.length) prioridades.push('O fluxo do período está equilibrado. Mantenha a rotina de registrar gastos e reavalie a projeção a cada mês.');

  return { atual, taxaPoupanca, comprometimentoFixo, variacaoSaldo, maiorCategoria, primeiroSaldoNegativo, fluxoRecorrente, receitaRecorrente, pontoEquilibrio, lacunaRecorrente, indice, classificacao, cor, cenarios, prioridades };
}

export default function Relatorios({ mesAtual }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro,    setErro]    = useState(null);

  // Comparação entre meses
  const [mes1,        setMes1]        = useState("");
  const [mes2,        setMes2]        = useState("");
  const [comparacao,  setComparacao]  = useState(null);
  const [cmpLoading,  setCmpLoading]  = useState(false);

  // Histórico: paginação
  const [histPage, setHistPage] = useState(0);
  const HIST_PER_PAGE = 8;

  useEffect(() => {
    if (!mesAtual) return;
    async function fetchRelatorios() {
      setLoading(true);
      setErro(null);
      try {
        const json = await apiFetch(`/api/relatorios?mes=${encodeURIComponent(mesAtual)}`);
        setData(json);
      } catch (err) {
        console.error(err);
        setErro(err.message || "Erro ao carregar relatórios");
      } finally {
        setLoading(false);
      }
    }
    fetchRelatorios();
  }, [mesAtual]);

  const handleComparar = async () => {
    if (!mes1 || !mes2) return;
    setCmpLoading(true);
    try {
      const json = await apiFetch(
        `/api/relatorios?tipo=comparacao&mes1=${encodeURIComponent(mes1)}&mes2=${encodeURIComponent(mes2)}`
      );
      setComparacao(json);
    } catch (err) {
      console.error(err);
    } finally {
      setCmpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Gerando relatórios...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="error-state">
        <div className="error-state__icon">⚠️</div>
        <p className="error-state__title">Erro ao carregar relatórios</p>
        <p className="error-state__msg">{erro}</p>
      </div>
    );
  }

  if (!data) return null;

  const { projecao = [], categorias = [], historico = [] } = data;
  const visao = criarVisaoFinanceira(projecao, historico, categorias, mesAtual);

  // Pie chart
  let pieData = [];
  if (categorias.length > 0) {
    pieData = categorias.slice(0, 6);
    if (categorias.length > 6) {
      const outrosValor = categorias.slice(6).reduce((s, c) => s + c.value, 0);
      pieData.push({ name: "Demais", value: outrosValor });
    }
  }

  // Histórico paginado
  const histPaginas = Math.ceil(historico.length / HIST_PER_PAGE);
  const histSlice   = historico.slice(histPage * HIST_PER_PAGE, (histPage + 1) * HIST_PER_PAGE);

  // Gera lista de meses únicos do histórico para os seletores de comparação
  const mesesDisponiveis = [...new Set(historico.map(h => h.mes))];

  // Dados de bar chart para comparação
  const comparacaoBarData = comparacao ? [
    { name: "Receita",       [comparacao.mes1.mes]: comparacao.mes1.receita,       [comparacao.mes2.mes]: comparacao.mes2.receita       },
    { name: "Gastos Fixos",  [comparacao.mes1.mes]: comparacao.mes1.gastos_fixos,  [comparacao.mes2.mes]: comparacao.mes2.gastos_fixos  },
    { name: "Gastos Var.",   [comparacao.mes1.mes]: comparacao.mes1.gastos_variaveis, [comparacao.mes2.mes]: comparacao.mes2.gastos_variaveis },
    { name: "Saldo",         [comparacao.mes1.mes]: comparacao.mes1.saldo,         [comparacao.mes2.mes]: comparacao.mes2.saldo         },
  ] : [];

  return (
    <div className="flex flex-col gap-16">

      {/* ── Cabeçalho ── */}
      <div className="flex justify-between items-center print-hide reports-header" style={{ padding: "0 4px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Análise e Projeção</h2>
        <div className="flex gap-8 reports-actions">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => window.open(apiUrl(`/api/exportar?mes=${mesAtual}&formato=csv`), '_blank')}
          >
            📥 Exportar CSV
          </button>
          <button
            className="btn btn--teal btn--sm"
            onClick={() => window.print()}
          >
            🖨️ Salvar PDF
          </button>
        </div>
      </div>

      {/* ── Painel de decisão ── */}
      <div className="card" style={{ borderColor: `${visao.cor}55` }}>
        <div className="sec-header">
          <span className="sec-header__title">Visão financeira do período</span>
          <span className="sec-header__sub">Indicadores de fluxo de caixa e capacidade de ajuste</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {[
            { label: "Saúde do fluxo", value: `${visao.indice}/100`, sub: visao.classificacao, color: visao.cor },
            { label: "Taxa de poupança", value: `${visao.taxaPoupanca.toFixed(1)}%`, sub: "saldo / receita", color: visao.taxaPoupanca >= 20 ? "var(--teal)" : "#f59e0b" },
            { label: "Comprometimento fixo", value: `${visao.comprometimentoFixo.toFixed(1)}%`, sub: "fixos / receita", color: visao.comprometimentoFixo <= 50 ? "var(--teal)" : "#ef4444" },
            { label: "Variação do saldo", value: visao.variacaoSaldo === null ? "—" : `${visao.variacaoSaldo >= 0 ? "+" : ""}${fmt(visao.variacaoSaldo)}`, sub: "contra mês anterior", color: visao.variacaoSaldo === null || visao.variacaoSaldo >= 0 ? "var(--teal)" : "#ef4444" },
            { label: "Fluxo recorrente", value: `${visao.fluxoRecorrente >= 0 ? "+" : ""}${fmt(visao.fluxoRecorrente)}`, sub: "receitas contratadas − despesas recorrentes", color: visao.fluxoRecorrente >= 0 ? "var(--teal)" : "#ef4444" },
            { label: "Ponto de equilíbrio", value: fmt(visao.pontoEquilibrio), sub: visao.lacunaRecorrente > 0 ? `faltam ${fmt(visao.lacunaRecorrente)}/mês` : "estrutura coberta", color: visao.lacunaRecorrente > 0 ? "#ef4444" : "var(--teal)" },
          ].map((indicador) => (
            <div key={indicador.label} style={{ padding: "14px", borderRadius: "var(--r-md)", background: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 7 }}>{indicador.label}</div>
              <div style={{ fontSize: 21, fontWeight: 750, fontFamily: "var(--mono)", color: indicador.color }}>{indicador.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 5 }}>{indicador.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 1fr)", gap: 18, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Prioridades sugeridas</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.45 }}>
              {visao.prioridades.slice(0, 3).map((prioridade) => <li key={prioridade}>{prioridade}</li>)}
            </ul>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: "var(--r-md)", background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.28)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong style={{ color: "#a5b4fc" }}>Leitura do cenário</strong><br />
            {visao.primeiroSaldoNegativo
              ? `A projeção-base exige atenção até ${visao.primeiroSaldoNegativo.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, '$1 $2')}.`
              : "A projeção-base permanece positiva nos próximos 12 meses."}
            {visao.maiorCategoria && <><br />Maior pressão atual: <strong>{visao.maiorCategoria.name}</strong> ({fmt(visao.maiorCategoria.value)}).</>}
          </div>
        </div>
      </div>

      {/* ── Projeção de Saldo — 12 meses ── */}
      <div className="card">
        <div className="sec-header">
          <span className="sec-header__title">Projeção de Saldo (Próximos 12 meses)</span>
          <span className="sec-header__sub">Baseado nas recorrências e saldo atual</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={visao.cenarios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--accent-teal)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                   tickFormatter={m => abreviarMes(m)} />
            <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                   tickFormatter={v => "R$" + (v / 1000).toFixed(0) + "k"} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="conservador" name="Cenário conservador"
              stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />
            <Area type="monotone" dataKey="otimista" name="Cenário otimista"
              stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 4" fill="none" />
            <Area type="monotone" dataKey="base" name="Cenário-base"
              stroke="var(--accent-teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 14, justifyContent: "flex-end", flexWrap: "wrap", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
          <span>Conservador: despesas +10%/mês</span><span>Base: recorrências registradas</span><span>Otimista: receitas +5%/mês</span>
        </div>
      </div>

      {/* ── Gráficos Secundários ── */}
      <div className="grid-sidebar">
        {/* Despesas por Categoria (Pie) */}
        <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Distribuição de Gastos</span>
          </div>
          {pieData.length > 0 ? (
            <div className="report-pie-layout" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || `hsl(${index * 45 + 10}, 65%, 58%)`} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="report-pie-legend" style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
                {pieData.map((entry, idx) => (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-secondary)", fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[entry.name] || `hsl(${idx * 45 + 10}, 65%, 58%)`, flexShrink: 0 }} />
                    <span style={{ width: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
              Nenhum gasto neste mês.
            </div>
          )}
        </div>

        {/* Resumo em Tabela */}
        <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Resumo do Período</span>
          </div>
          <div className="flex flex-col gap-12" style={{ padding: "8px 0" }}>
            {categorias.slice(0, 5).map((c) => (
              <div key={c.name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", background: "var(--canvas-soft)", borderRadius: "var(--r-md)"
              }}>
                <span style={{ fontSize: 13, color: "var(--ink-secondary)", fontWeight: 500 }}>{c.name}</span>
                <span style={{ fontSize: 13, fontFamily: "var(--mono)", color: "var(--red)", fontWeight: 600 }}>
                  {fmt(c.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Histórico Consolidado ── */}
      <div className="card">
        <div className="sec-header">
          <span className="sec-header__title">Histórico Consolidado</span>
          <span className="sec-header__sub">Todos os meses com dados registrados</span>
        </div>

        {historico.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px", fontSize: 13 }}>
            Nenhum dado histórico encontrado.
          </div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: "right" }}>Receita</th>
                    <th style={{ textAlign: "right" }}>Gastos Fixos</th>
                    <th style={{ textAlign: "right" }}>Gastos Var.</th>
                    <th style={{ textAlign: "right" }}>Total Gastos</th>
                    <th style={{ textAlign: "right" }}>Saldo</th>
                    <th style={{ width: 100 }}>Balanço</th>
                  </tr>
                </thead>
                <tbody>
                  {histSlice.map((h) => {
                    const saldoPositivo = h.saldo >= 0;
                    const pctReceita = h.receita > 0 ? Math.min((h.gastos_totais / h.receita) * 100, 100) : 0;
                    return (
                      <tr key={h.mes}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {h.mes === mesAtual
                            ? <span>📍 {h.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</span>
                            : h.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")
                          }
                        </td>
                        <td style={{ textAlign: "right", color: "var(--teal)", fontWeight: 600 }}>{fmt(h.receita)}</td>
                        <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{fmt(h.gastos_fixos)}</td>
                        <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{fmt(h.gastos_variaveis)}</td>
                        <td style={{ textAlign: "right", color: "var(--red, #ef4444)", fontWeight: 600 }}>{fmt(h.gastos_totais)}</td>
                        <td style={{ textAlign: "right", color: saldoPositivo ? "var(--teal)" : "#ef4444", fontWeight: 700 }}>
                          {saldoPositivo ? "+" : ""}{fmt(h.saldo)}
                        </td>
                        <td>
                          <div style={{ height: 6, borderRadius: 3, background: "var(--canvas-soft)", overflow: "hidden" }}>
                            <div style={{
                              width: pctReceita + "%", height: "100%",
                              background: pctReceita >= 100 ? "#ef4444" : pctReceita >= 80 ? "#f59e0b" : "var(--teal)",
                              borderRadius: 3,
                            }} />
                          </div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
                            {pctReceita.toFixed(0)}% da receita
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {histPaginas > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setHistPage(p => Math.max(p - 1, 0))}
                  disabled={histPage === 0}
                >← Anterior</button>
                <span style={{ fontSize: 12, color: "var(--text-muted)", alignSelf: "center" }}>
                  {histPage + 1} / {histPaginas}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setHistPage(p => Math.min(p + 1, histPaginas - 1))}
                  disabled={histPage === histPaginas - 1}
                >Próximo →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Comparação entre Meses ── */}
      <div className="card">
        <div className="sec-header">
          <span className="sec-header__title">Comparação entre Meses</span>
          <span className="sec-header__sub">Selecione dois meses para comparar lado a lado</span>
        </div>

        {/* Seletores */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Mês 1</label>
            <select
              className="modal__select"
              value={mes1}
              onChange={e => setMes1(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Selecione…</option>
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>{m.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Mês 2</label>
            <select
              className="modal__select"
              value={mes2}
              onChange={e => setMes2(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">Selecione…</option>
              {mesesDisponiveis.map(m => (
                <option key={m} value={m}>{m.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</option>
              ))}
            </select>
          </div>
          <button
            className="btn btn--teal btn--sm"
            onClick={handleComparar}
            disabled={!mes1 || !mes2 || cmpLoading || mes1 === mes2}
            style={{ alignSelf: "flex-end" }}
          >
            {cmpLoading ? "Carregando…" : "🔍 Comparar"}
          </button>
        </div>

        {/* Resultado da comparação */}
        {comparacao && (
          <div className="flex flex-col gap-16">
            {/* Gráfico de barras */}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparacaoBarData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                       tickFormatter={v => "R$" + (v / 1000).toFixed(0) + "k"} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--ink-muted)" }} />
                <Bar dataKey={comparacao.mes1.mes} name={comparacao.mes1.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}
                     fill="var(--accent-teal)" radius={[4,4,0,0]} />
                <Bar dataKey={comparacao.mes2.mes} name={comparacao.mes2.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}
                     fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabela comparativa */}
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th style={{ textAlign: "right" }}>{comparacao.mes1.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</th>
                    <th style={{ textAlign: "right" }}>{comparacao.mes2.mes.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</th>
                    <th style={{ textAlign: "right" }}>Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Receita",        key: "receita",          color: "var(--teal)",   signo: 1  },
                    { label: "Gastos Fixos",   key: "gastos_fixos",     color: "var(--red, #ef4444)",  signo: -1 },
                    { label: "Gastos Var.",    key: "gastos_variaveis", color: "var(--red, #ef4444)",  signo: -1 },
                    { label: "Total Gastos",   key: "gastos_totais",    color: "var(--red, #ef4444)",  signo: -1 },
                    { label: "Saldo",          key: "saldo",            color: "var(--text-primary)", signo: 1 },
                  ].map(({ label, key, color, signo }) => {
                    const v1   = comparacao.mes1[key];
                    const v2   = comparacao.mes2[key];
                    const diff = v2 - v1;
                    const diffColor = diff * signo >= 0 ? "var(--teal)" : "#ef4444";
                    return (
                      <tr key={key}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{label}</td>
                        <td style={{ textAlign: "right", color }}>{fmt(v1)}</td>
                        <td style={{ textAlign: "right", color }}>{fmt(v2)}</td>
                        <td style={{ textAlign: "right", color: diffColor, fontWeight: 600 }}>
                          {diff >= 0 ? "+" : ""}{fmt(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!comparacao && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
            Selecione dois meses e clique em &quot;Comparar&quot; para ver a análise.
          </div>
        )}
      </div>

    </div>
  );
}
