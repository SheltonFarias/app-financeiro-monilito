/**
 * Investimentos — Carteira com alocação e resultado.
 */
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, pct, fmtDate } from "../utils/format";
import { deleteRow } from "../utils/apiService";
import { useToast } from "../components/Toast";

const TIPO_COLOR = { FII: "#34d399", "Ação": "#4f9cf9", ETF: "#f59e0b", "Renda Fixa": "#a78bfa" };

export default function Investimentos({ data, onAdd, onEdit, refetch }) {
  const [toggling, setToggling] = useState(null);
  const { toast } = useToast();

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

  const enriched = data.map(inv => {
    const precoAtual = inv.precoMedio;
    const valorTotal = inv.quantidade * precoAtual;
    return { ...inv, precoAtual, valorTotal };
  });
  const totalInvestido = enriched.reduce((s, i) => s + i.valorTotal, 0);

  const tipoData = Object.entries(
    enriched.reduce((acc, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + i.valorTotal; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-16">
      {/* KPIs */}
      <div className="grid-kpi">
        {[
          { label: "Patrimônio Total",  value: fmt(totalInvestido),   color: "purple" },
          { label: "FIIs",             value: fmt(enriched.filter(i => i.tipo === "FII").reduce((s, i) => s + i.valorTotal, 0)), color: "green" },
          { label: "Ações",            value: fmt(enriched.filter(i => i.tipo === "Ação").reduce((s, i) => s + i.valorTotal, 0)), color: "blue" },
          { label: "Renda Fixa",       value: fmt(enriched.filter(i => i.tipo === "Renda Fixa").reduce((s, i) => s + i.valorTotal, 0)), color: "amber" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabela + Alocação */}
      <div className="grid-sidebar">
        <div className="card card--flat">
          <div className="tbl-header">
            <span className="tbl-header__title">Carteira de Investimentos</span>
            <button className="btn btn--green" onClick={onAdd}>+ Adicionar</button>
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
                    <th>Ativo</th><th>Tipo</th><th>Qtd.</th>
                    <th>P. Médio</th><th>Valor Total</th><th>Data</th><th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map((inv, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 13 }}>{inv.ticker}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{inv.setor}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: (TIPO_COLOR[inv.tipo] || "#64748b") + "22", color: TIPO_COLOR[inv.tipo] || "#64748b" }}>
                          {inv.tipo}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{inv.quantidade}</td>
                      <td className="val val--muted">{fmt(inv.precoMedio)}</td>
                      <td className="val val--primary">{fmt(inv.valorTotal)}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmtDate(inv.dataCompra)}</td>
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
                    <td colSpan={4}>TOTAL</td>
                    <td className="val val--primary">{fmt(totalInvestido)}</td>
                    <td />
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
                <div className="legend-item__value">{pct(t.value, totalInvestido)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{fmt(t.value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
