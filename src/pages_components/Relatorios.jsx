import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { fmt, COLORS } from "../utils/format";
import { apiFetch } from "../utils/apiService";

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

export default function Relatorios({ mesAtual }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!mesAtual) return; // aguarda mesAtual ser inicializado
    async function fetchRelatorios() {
      setLoading(true);
      setErro(null);
      try {
        // Usa apiFetch (com Bearer token) em vez de fetch direto — o middleware exige JWT
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


  const { projecao = [], categorias = [] } = data;
  
  // Extrai as 6 maiores categorias para o PieChart e agrupa o resto em "Outros" se houver
  let pieData = [];
  if (categorias.length > 0) {
    pieData = categorias.slice(0, 6);
    if (categorias.length > 6) {
      const outrosValor = categorias.slice(6).reduce((s, c) => s + c.value, 0);
      pieData.push({ name: "Demais", value: outrosValor });
    }
  }

  return (
    <div className="flex flex-col gap-16">
      
      <div className="flex justify-between items-center print-hide" style={{ padding: "0 4px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Análise e Projeção</h2>
        <div className="flex gap-8">
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={() => window.open(`/api/exportar?mes=${mesAtual}&formato=csv`, '_blank')}
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

      {/* ── Projeção de Saldo ── */}
      <div className="card">
        <div className="sec-header">
          <span className="sec-header__title">Projeção de Saldo (Próximos 6 meses)</span>
          <span className="sec-header__sub">Baseado nas recorrências e saldo atual</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={projecao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-teal)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-teal)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false} 
                   tickFormatter={m => m.replace(/([A-Za-z]+)(\d+)/, "$1").substring(0, 3)} />
            <YAxis tick={{ fill: "var(--ink-muted)", fontSize: 10 }} axisLine={false} tickLine={false}
                   tickFormatter={v => "R$" + (v / 1000).toFixed(0) + "k"} />
            <RechartsTooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="saldo" name="Saldo Projetado" stroke="var(--accent-teal)" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Gráficos Secundários ── */}
      <div className="grid-sidebar">
        {/* Despesas por Categoria (Pie) */}
        <div className="card">
          <div className="sec-header">
            <span className="sec-header__title">Distribuição de Gastos</span>
          </div>
          {pieData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 16 }}>
                {pieData.map((entry, idx) => (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-secondary)", fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[entry.name] || `hsl(${idx * 45 + 10}, 65%, 58%)` }} />
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
      
    </div>
  );
}
