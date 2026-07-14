/**
 * VisaoGeral — Dashboard principal no estilo das referências:
 * KPIs grandes em 2 linhas + gráfico de barras largo +
 * donuts de orçamento + tabela de demonstração de resultados.
 */
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { fmt, pct, COLORS } from "../utils/format";

/* ─── Tooltip customizado ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--hairline)",
      borderRadius: "var(--r-md)", padding: "10px 14px", fontSize: 12,
      boxShadow: "var(--shadow-1)"
    }}>
      <div style={{ color: "var(--ink-secondary)", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ─── Donut com label central ── */
function DonutKPI({ value, total, label, color, sub }) {
  const pctVal = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const data = [
    { value: pctVal },
    { value: Math.max(100 - pctVal, 0) },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={54}
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              <Cell fill={color} />
              <Cell fill="var(--canvas-soft)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "var(--mono)" }}>
            {pctVal.toFixed(0)}%
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function VisaoGeral({ data, onAddOrcamento, onEditOrcamento }) {
  const { gastosFixos, gastosVariaveis, receitas, investimentos, orcamentos = [], resumo, evolucaoMensal } = data;

  /* ─── Totais ── */
  const totalFixo    = gastosFixos.reduce((s, g) => s + g.valor, 0);
  const totalVar     = gastosVariaveis.reduce((s, g) => s + g.valor, 0);
  const totalGasto   = totalFixo + totalVar;
  const totalReceita = receitas.reduce((s, r) => s + r.valor, 0);
  const saldo        = totalReceita - totalGasto;
  const totalInvest  = investimentos.reduce((s, i) => s + i.quantidade * i.precoMedio, 0);

  const pagas    = [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pago").reduce((s, g) => s + g.valor, 0);
  const pendente = [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pendente").reduce((s, g) => s + g.valor, 0);

  const contasEmAberto = [...gastosFixos, ...gastosVariaveis]
    .filter(g => g.situacao === "Pendente")
    .sort((a, b) => b.valor - a.valor);

  /* ─── Gráfico mensal (usa evolucaoMensal se disponível, senão mês atual) ── */
  const chartData = evolucaoMensal?.length > 0
    ? evolucaoMensal
    : [{ mes: "Atual", receitas: totalReceita, gastos: totalGasto, saldo }];

  /* ─── Distribuição por categoria e Orçamentos ── */
  const catMap = {};
  gastosFixos.forEach(g => { catMap[g.categoria] = (catMap[g.categoria] || 0) + g.valor; });
  gastosVariaveis.forEach(g => { catMap[g.categoria] = (catMap[g.categoria] || 0) + g.valor; });
  
  const catAndOrcamentos = Object.keys(catMap).map(name => {
    const value = catMap[name];
    const orc = orcamentos.find(o => o.categoria === name);
    return { name, value, orcamento: orc };
  });
  
  // Adiciona orçamentos que ainda não tiveram gastos
  orcamentos.forEach(o => {
    if (!catMap[o.categoria]) {
      catAndOrcamentos.push({ name: o.categoria, value: 0, orcamento: o });
    }
  });

  const catData = catAndOrcamentos
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  /* ─── Receitas por situação ── */
  const recebido = receitas.filter(r => r.situacao === "Recebido").reduce((s, r) => s + r.valor, 0);

  return (
    <div className="flex flex-col gap-16">

      {/* ── Linha 1: 4 KPIs principais ── */}
      <div className="grid-kpi">
        <KPI color="teal"   label="Total Receita"     value={fmt(totalReceita)}
          sub={`${recebido > 0 ? fmt(recebido) + " recebido" : "aguardando recebimento"}`} />
        <KPI color="red"    label="Total Despesas"    value={fmt(totalGasto)}
          sub={pct(totalGasto, totalReceita) + " da receita"} />
        <KPI color="blue"   label="Saldo Livre"       value={fmt(saldo)}
          sub={saldo >= 0 ? "Situação positiva ✓" : "Deficit ⚠"} />
        <KPI color="purple" label="Patrimônio Invest." value={fmt(totalInvest)}
          sub={`${investimentos.length} ativos`} />
      </div>

      {/* ── Linha 2: 2 KPIs secundários + 2 donuts ── */}
      <div className="grid-kpi">
        <KPI color="green"  label="Contas Pagas"    value={fmt(pagas)}
          sub={`${gastosFixos.filter(g => g.situacao === "Pago").length + gastosVariaveis.filter(g => g.situacao === "Pago").length} itens`} />
        <KPI color="amber"  label="A Pagar"         value={fmt(pendente)}
          sub={`${gastosFixos.filter(g => g.situacao === "Pendente").length + gastosVariaveis.filter(g => g.situacao === "Pendente").length} itens pendentes`} />

        {/* Donut: % de gastos fixos sobre receita */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <DonutKPI
            value={totalFixo} total={totalReceita}
            label="Gastos Fixos / Receita"
            color="var(--blue)"
            sub={fmt(totalFixo)}
          />
        </div>

        {/* Donut: % de gastos variáveis sobre receita */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <DonutKPI
            value={totalVar} total={totalReceita}
            label="Gastos Variáveis / Receita"
            color="var(--amber)"
            sub={fmt(totalVar)}
          />
        </div>
      </div>

      {/* ── Linha 3: Gráfico largo + Categorias ── */}
      <div className="grid-sidebar">
        {/* Gráfico Receitas vs Despesas */}
        <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Receitas e Despesas</span>
            <span className="sec-header__sub">{chartData.length} período(s)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ left: 0, right: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-teal)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--accent-teal)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="gradGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--red)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--red)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => "R$" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="receitas" name="Receitas" fill="url(#gradReceita)" radius={[4,4,0,0]} maxBarSize={40} />
              <Bar dataKey="gastos"   name="Gastos"   fill="url(#gradGasto)"   radius={[4,4,0,0]} maxBarSize={40} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="var(--accent-orange)"
                strokeWidth={2} dot={{ r: 3, fill: "var(--accent-orange)" }} />
            </ComposedChart>
          </ResponsiveContainer>
          {/* Legenda */}
          <div className="flex gap-16" style={{ marginTop: 10 }}>
            {[["var(--accent-teal)","Receitas"], ["var(--red)","Gastos"], ["var(--accent-orange)","Saldo"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-4" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Gastos por Categoria & Orçamentos */}
        <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Orçamentos & Categorias</span>
            <button
              onClick={onAddOrcamento}
              className="btn btn--ghost"
              style={{ fontSize: 12 }}
            >
              + Orçamento
            </button>
          </div>
          <div className="flex flex-col gap-8">
            {catData.map((c, i) => {
              let p = 0;
              let hasOrc = !!c.orcamento;
              let limit = c.orcamento ? c.orcamento.valor_limite : 0;
              let color = COLORS[c.name] || `hsl(${i * 55},65%,58%)`;
              let warningAlert = null;

              if (hasOrc && limit > 0) {
                p = (c.value / limit) * 100;
                if (p > 100) {
                  color = "var(--red)";
                  warningAlert = "Estourou!";
                } else if (p >= 80) {
                  color = "var(--amber)";
                  warningAlert = "Atenção (>80%)";
                }
              } else if (totalGasto > 0) {
                p = (c.value / totalGasto) * 100;
              }

              return (
                <div key={c.name} className="flex flex-col gap-4">
                  <div className="flex justify-between" style={{ fontSize: 11 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span
                        style={{ color: "var(--text-secondary)", cursor: hasOrc ? "pointer" : "default" }}
                        onClick={() => hasOrc && onEditOrcamento(c.orcamento)}
                        title={hasOrc ? "Editar Orçamento" : ""}
                      >
                        {c.name} {hasOrc && <span style={{ fontSize: 9 }}>⚙️</span>}
                      </span>
                      {warningAlert && <span style={{ fontSize: 9, color: color, fontWeight: 700 }}>{warningAlert}</span>}
                    </div>
                    <span style={{ color: "var(--text-primary)", fontFamily: "var(--mono)" }}>
                      {fmt(c.value)} {hasOrc && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>/ {fmt(limit)}</span>}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: Math.min(p, 100) + "%", background: color }} />
                  </div>
                </div>
              );
            })}
            {catData.length === 0 && <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Nenhum dado</div>}
          </div>
        </div>
      </div>

      {/* ── Linha 4: Receitas + Demonstração de Resultados ── */}
      <div className="grid-sidebar">
        {/* Tabela de Receitas */}
        <div className="card card--flat">
          <div className="tbl-header">
            <span className="tbl-header__title">Receitas do Mês</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{receitas.filter(r => r.valor > 0).length} fontes</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {receitas.filter(r => r.valor > 0).map((r) => (
                  <tr key={r.id ?? r.descricao}>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {r.descricao}
                    </td>
                    <td className="val val--teal">{fmt(r.valor)}</td>
                    <td>
                      <span className={`status-pill status-pill--${(r.situacao || "pendente").toLowerCase()}`}>
                        <span className="status-pill__dot" />
                        {r.situacao}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="tbl__total">
                  <td>TOTAL</td>
                  <td className="val val--teal">{fmt(totalReceita)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-16">
          {/* Lembrete: Contas em Aberto */}
          <div className="card card--flat">
            <div className="sec-header" style={{ marginBottom: 12 }}>
              <span className="sec-header__title">⚠️ Contas em Aberto</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{contasEmAberto.length} pendentes</span>
            </div>
            {contasEmAberto.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: 12 }}>
                Tudo pago neste mês! 🎉
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                {contasEmAberto.map((conta) => (
                  <div key={conta.id ?? conta.descricao} style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "var(--canvas-soft)", padding: "10px 12px", borderRadius: "var(--r-md)",
                    borderLeft: "3px solid var(--red)"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{conta.descricao}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{conta.categoria || "Gasto"}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--red)", fontFamily: "var(--mono)" }}>
                      {fmt(conta.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demonstração de Resultados */}
          <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Demonstração de Resultados</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, minWidth: 80, textAlign: "right" }}>VALOR</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, minWidth: 40, textAlign: "right" }}>%</span>
          </div>
          {[
            { label: "Total Receita",     val: totalReceita, pct: 100,                              bold: true,  color: "teal" },
            { label: "Gastos Fixos",      val: totalFixo,    pct: totalReceita > 0 ? (totalFixo / totalReceita * 100).toFixed(0) : 0 },
            { label: "Gastos Variáveis",  val: totalVar,     pct: totalReceita > 0 ? (totalVar  / totalReceita * 100).toFixed(0) : 0 },
            { label: "Total Despesas",    val: totalGasto,   pct: totalReceita > 0 ? (totalGasto/ totalReceita * 100).toFixed(0) : 0, bold: true, color: "red" },
            { label: "Saldo Livre",       val: saldo,        pct: totalReceita > 0 ? (Math.abs(saldo)/ totalReceita * 100).toFixed(0) : 0, bold: true, color: saldo >= 0 ? "teal" : "red" },
            { label: "Patrimônio Invest.",val: totalInvest,  pct: "—" },
          ].map((row, i) => (
            <div key={i} className={`demo-row ${row.bold ? "demo-row--bold" : ""} ${row.color ? "demo-row--" + row.color : ""}`}>
              <span className="demo-row__label">{row.label}</span>
              <div className="demo-row__vals">
                <span className="demo-row__val">{fmt(row.val)}</span>
                <span className="demo-row__pct">{typeof row.pct === "number" ? row.pct + "%" : row.pct}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card sub-componente ── */
function KPI({ label, value, sub, color }) {
  return (
    <div className={`kpi kpi--${color}`}>
      <div className="kpi__accent-bar" />
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {sub && <div className="kpi__sub">{sub}</div>}
    </div>
  );
}
