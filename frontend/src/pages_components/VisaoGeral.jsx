/**
 * VisaoGeral — Dashboard principal no estilo das referências:
 * KPIs grandes em 2 linhas + gráfico de barras largo +
 * donuts de orçamento + tabela de demonstração de resultados.
 */
import { useMemo, useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { fmt, COLORS } from "../utils/format";

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
  const possuiBase = total > 0;
  const pctVal = possuiBase ? Math.min((value / total) * 100, 100) : 0;
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
            {possuiBase ? `${pctVal.toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{label}</div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
          {possuiBase ? sub : "receita não registrada"}
        </div>
      </div>
    </div>
  );
}

const dataDaConta = (conta) => {
  const texto = conta.parcela || conta.vencimento || conta.dataCompra || conta.data_compra;
  if (!texto) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return new Date(`${texto.slice(0, 10)}T12:00:00`);
  const dia = Number(texto);
  if (Number.isInteger(dia) && dia >= 1 && dia <= 31) {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), dia, 12);
  }
  return null;
};

const urgenciaConta = (conta) => {
  const data = dataDaConta(conta);
  if (!data) return { tipo: 'sem-data', texto: 'Sem vencimento informado', dias: 9999 };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((data - hoje) / 86400000);
  if (dias < 0) return { tipo: 'atrasada', texto: `${Math.abs(dias)} dia(s) em atraso`, dias };
  if (dias === 0) return { tipo: 'hoje', texto: 'Vence hoje', dias };
  if (dias <= 7) return { tipo: 'proxima', texto: `Vence em ${dias} dia(s)`, dias };
  return { tipo: 'futura', texto: `Vence em ${dias} dias`, dias };
};

export default function VisaoGeral({ data, onAddOrcamento, onEditOrcamento, onMarkPaid }) {
  const [filtroPendencias, setFiltroPendencias] = useState('todas');
  const { gastosFixos, gastosVariaveis, receitas, investimentos, orcamentos = [], resumo, evolucaoMensal } = data;

  /* ─── Totais ── */
  const totalFixo    = gastosFixos.reduce((s, g) => s + g.valor, 0);
  const totalVar     = gastosVariaveis.reduce((s, g) => s + g.valor, 0);
  const totalGasto   = totalFixo + totalVar;
  const totalReceita = receitas.reduce((s, r) => s + r.valor, 0);
  const saldo        = totalReceita - totalGasto;
  const totalInvest  = investimentos.reduce((s, i) => s + i.quantidade * i.precoMedio, 0);
  const percentualGastos = totalReceita > 0 ? (totalGasto / totalReceita) * 100 : null;
  const comprometimentoFixo = totalReceita > 0 ? (totalFixo / totalReceita) * 100 : null;

  const pagas    = [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pago").reduce((s, g) => s + g.valor, 0);
  const pendente = [...gastosFixos, ...gastosVariaveis].filter(g => g.situacao === "Pendente").reduce((s, g) => s + g.valor, 0);

  const contasEmAberto = useMemo(() => [
    ...gastosFixos.map((g) => ({ ...g, origem: 'gastos_fixos' })),
    ...gastosVariaveis.map((g) => ({ ...g, origem: 'gastos_variaveis' })),
  ].filter(g => g.situacao === "Pendente").map((g) => ({ ...g, urgencia: urgenciaConta(g) }))
    .sort((a, b) => a.urgencia.dias - b.urgencia.dias || b.valor - a.valor), [gastosFixos, gastosVariaveis]);
  const contasFiltradas = contasEmAberto.filter((conta) => filtroPendencias === 'todas' || (filtroPendencias === '7dias' ? conta.urgencia.dias >= 0 && conta.urgencia.dias <= 7 : conta.urgencia.tipo === filtroPendencias));

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
  const orcamentosCriticos = catAndOrcamentos.filter(({ value, orcamento }) =>
    orcamento?.valor_limite > 0 && value / orcamento.valor_limite >= 0.8
  );

  const alertaPrincipal = totalReceita <= 0
    ? { cor: "#f59e0b", titulo: "Receita não registrada", texto: `${fmt(pendente)} em compromissos pendentes; percentuais e projeções de cobertura ficam indisponíveis até registrar a receita.` }
    : saldo < 0
      ? { cor: "#ef4444", titulo: "Déficit no resultado do mês", texto: `As despesas superam a receita em ${fmt(Math.abs(saldo))}. Priorize compromissos essenciais e reveja gastos variáveis.` }
      : orcamentosCriticos.length > 0
        ? { cor: "#f59e0b", titulo: "Orçamento em atenção", texto: `${orcamentosCriticos.length} categoria(s) já consumiram pelo menos 80% do limite definido.` }
        : { cor: "var(--teal)", titulo: "Fluxo mensal equilibrado", texto: "O resultado do mês está positivo. Acompanhe as contas pendentes até o próximo recebimento." };

  /* ─── Receitas por situação ── */
  const recebido = receitas.filter(r => r.situacao === "Recebido").reduce((s, r) => s + r.valor, 0);
  const saldoBaseCaixa = recebido - pagas;
  const eventosCaixa = contasEmAberto.filter((conta) => conta.urgencia.dias >= 0 && conta.urgencia.dias <= 60).map((conta) => ({ ...conta, data: dataDaConta(conta) })).sort((a, b) => a.data - b.data);
  const projecaoCaixa = eventosCaixa.reduce((estado, evento) => {
    const saldoProjetado = estado.saldo - evento.valor;
    estado.saldo = saldoProjetado;
    estado.linhas.push({ ...evento, saldoProjetado });
    return estado;
  }, { saldo: saldoBaseCaixa, linhas: [] });
  const menorSaldoProjetado = projecaoCaixa.linhas.reduce((menor, linha) => Math.min(menor, linha.saldoProjetado), saldoBaseCaixa);

  return (
    <div className="flex flex-col gap-16">
      <div className="dashboard-alert" style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 15px", borderRadius: "var(--r-md)", background: `${alertaPrincipal.cor}12`, border: `1px solid ${alertaPrincipal.cor}55` }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: alertaPrincipal.cor, flexShrink: 0 }} />
        <div>
          <strong style={{ display: "block", color: alertaPrincipal.cor, fontSize: 13 }}>{alertaPrincipal.titulo}</strong>
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{alertaPrincipal.texto}</span>
        </div>
      </div>

      {/* ── Linha 1: 4 KPIs principais ── */}
      <div className="grid-kpi">
        <KPI color="teal"   label="Total Receita"     value={fmt(totalReceita)}
          sub={`${recebido > 0 ? fmt(recebido) + " recebido" : "aguardando recebimento"}`} />
        <KPI color="red"    label="Total Despesas"    value={fmt(totalGasto)}
          sub={percentualGastos === null ? "receita não registrada" : `${percentualGastos.toFixed(1)}% da receita`} />
        <KPI color="blue"   label="Resultado do Mês"  value={fmt(saldo)}
          sub={saldo >= 0 ? "Situação positiva ✓" : "Deficit ⚠"} />
        <KPI color="purple" label="Patrimônio Invest." value={fmt(totalInvest)}
          sub={`${investimentos.length} ativos`} />
      </div>

      {/* ── Linha 2: 2 KPIs secundários + 2 donuts ── */}
      <div className="grid-kpi">
        <KPI color="green"  label="Contas Pagas"    value={fmt(pagas)}
          sub={`${gastosFixos.filter(g => g.situacao === "Pago").length + gastosVariaveis.filter(g => g.situacao === "Pago").length} itens`} />
        <KPI color="amber"  label="Compromissos Pendentes" value={fmt(pendente)}
          sub={`${gastosFixos.filter(g => g.situacao === "Pendente").length + gastosVariaveis.filter(g => g.situacao === "Pendente").length} itens pendentes`} />

        {/* Donut: % de gastos fixos sobre receita */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <DonutKPI
            value={totalFixo} total={totalReceita}
            label="Gastos Fixos / Receita"
            color="var(--blue)"
            sub={comprometimentoFixo === null ? "" : `${fmt(totalFixo)} comprometidos`}
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
            <span className="sec-header__sub">{chartData.length < 2 ? "registre mais meses para analisar tendências" : `${chartData.length} períodos`}</span>
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
          {chartData.length < 2 && (
            <div style={{ marginTop: 12, padding: "9px 11px", borderRadius: "var(--r-sm)", background: "var(--canvas-soft)", color: "var(--text-muted)", fontSize: 11 }}>
              A tendência ficará mais útil após o registro de pelo menos três períodos mensais.
            </div>
          )}
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

      {/* ── Linha 4: Receitas do Mês — largura total ── */}
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

      <div className="cash-forecast-card">
        <div className="cash-forecast-card__header"><div><span className="sec-header__title">Previsão diária de caixa</span><span>Próximos 60 dias · baseada nos vencimentos cadastrados</span></div><div><strong>{fmt(menorSaldoProjetado)}</strong><small>menor saldo projetado</small></div></div>
        <div className="cash-forecast-card__body">
          <div className="cash-forecast-card__base"><span>Saldo inicial de referência</span><strong>{fmt(saldoBaseCaixa)}</strong><small>Receitas recebidas menos contas já pagas no período. Configure contas financeiras para uma conciliação completa.</small></div>
          <div className="cash-forecast-card__events">{projecaoCaixa.linhas.length === 0 ? <span>Nenhum vencimento datado nos próximos 60 dias.</span> : projecaoCaixa.linhas.slice(0, 6).map((linha) => <div key={linha.id ?? linha.descricao}><span>{linha.data.toLocaleDateString('pt-BR')} · {linha.descricao}</span><strong className={linha.saldoProjetado < 0 ? 'text-red' : ''}>{fmt(linha.saldoProjetado)}</strong></div>)}</div>
        </div>
      </div>

      {/* ── Linha 5: Contas em Aberto + Demonstração de Resultados ── */}
      <div className="flex flex-col gap-16">
          {/* Lembrete: Contas em Aberto */}
          <div className="card card--flat open-accounts-card">
            <div className="open-accounts-card__header">
              <div><span className="sec-header__title">⚠️ Contas em Aberto</span><span className="open-accounts-card__caption">Priorize estes compromissos no fluxo do mês</span></div>
              <div className="open-accounts-card__summary"><strong>{fmt(pendente)}</strong><span>{contasEmAberto.length} pendentes</span></div>
            </div>
            <div className="open-accounts-card__filters">
              {[['todas', 'Todas'], ['atrasada', 'Atrasadas'], ['hoje', 'Hoje'], ['7dias', 'Próximos 7 dias']].map(([key, label]) => <button key={key} className={filtroPendencias === key ? 'filter-btn filter-btn--red filter-btn--active' : 'filter-btn'} onClick={() => setFiltroPendencias(key)}>{label}</button>)}
            </div>
            {contasEmAberto.length === 0 ? (
              <div className="open-accounts-card__empty">
                Tudo pago neste mês! 🎉
              </div>
            ) : (
              <div className="open-accounts-card__list">
                {contasFiltradas.length === 0 && <div className="open-accounts-card__empty">Nenhuma conta neste filtro.</div>}
                {contasFiltradas.map((conta) => (
                  <div key={conta.id ?? conta.descricao} className="open-account-item">
                    <div className="open-account-item__icon">!</div>
                    <div className="open-account-item__detail">
                      <span className="open-account-item__description">{conta.descricao}</span>
                      <span className="open-account-item__category">{conta.categoria || "Gasto"} · {conta.urgencia.texto}</span>
                    </div>
                    <div className="open-account-item__value"><span>A pagar</span><strong>{fmt(conta.valor)}</strong><button className="open-account-item__pay" onClick={() => onMarkPaid?.(conta)}>Marcar pago</button></div>
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
            { label: "Total Receita",     val: totalReceita, pct: totalReceita > 0 ? 100 : "—",                    bold: true,  color: "teal" },
            { label: "Gastos Fixos",      val: totalFixo,    pct: totalReceita > 0 ? (totalFixo / totalReceita * 100).toFixed(0) : "—" },
            { label: "Gastos Variáveis",  val: totalVar,     pct: totalReceita > 0 ? (totalVar  / totalReceita * 100).toFixed(0) : "—" },
            { label: "Total Despesas",    val: totalGasto,   pct: totalReceita > 0 ? (totalGasto/ totalReceita * 100).toFixed(0) : "—", bold: true, color: "red" },
            { label: "Resultado do Mês",  val: saldo,        pct: totalReceita > 0 ? (Math.abs(saldo)/ totalReceita * 100).toFixed(0) : "—", bold: true, color: saldo >= 0 ? "teal" : "red" },
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
