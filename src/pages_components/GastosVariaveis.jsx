/**
 * GastosVariaveis — Lançamentos variáveis do mês.
 * Feature 3: Linhas com parcelas vencidas são destacadas em vermelho.
 * Feature 4: Busca por descrição/categoria + filtros rápidos de situação.
 * Feature 7: Ordenação automática (vencidos primeiro, depois por valor).
 * Feature 1b: StatusToggle clicável que salva na planilha via updateStatus().
 */
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, COLORS, fmtDate, isOverdue } from "../utils/format";
import { updateStatus, deleteRow } from "../utils/apiService";
import { useToast } from "../components/Toast";
import StatusToggle from "../components/StatusToggle";

const FILTROS = [
  { key: "todos",    label: "Todos",    color: "" },
  { key: "pendente", label: "Pendente", color: "red" },
  { key: "pago",     label: "Pago",     color: "green" },
];

const SORT_OPTIONS = [
  { key: "valor",     label: "Valor" },
  { key: "parcela",   label: "Parcela" },
  { key: "categoria", label: "Categoria" },
];

export default function GastosVariaveis({ data, onAdd, onEdit, refetch }) {
  const [search,  setSearch]  = useState("");
  const [filtro,  setFiltro]  = useState("todos");
  const [sortBy,  setSortBy]  = useState("valor");
  const [sortDir, setSortDir] = useState("desc");
  const [toggling, setToggling] = useState(null);

  const { toast } = useToast();

  /* ─── Filtragem ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(g => {
      const matchSearch = !q ||
        g.descricao.toLowerCase().includes(q) ||
        g.categoria.toLowerCase().includes(q) ||
        (g.pagamento || "").toLowerCase().includes(q);

      const matchFiltro =
        filtro === "todos"    ? true :
        filtro === "pendente" ? g.situacao === "Pendente" :
        filtro === "pago"     ? g.situacao === "Pago" :
        true;

      return matchSearch && matchFiltro;
    });
  }, [data, search, filtro]);

  /* ─── Ordenação ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Vencidos sempre no topo
      const aVencido = isOverdue(a.parcela, a.situacao);
      const bVencido = isOverdue(b.parcela, b.situacao);
      if (aVencido !== bVencido) return aVencido ? -1 : 1;

      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (sortBy === "valor") {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortBy === "parcela") {
        const dA = new Date(valA);
        const dB = new Date(valB);
        if (!isNaN(dA) && !isNaN(dB)) { valA = dA; valB = dB; }
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

  /* ─── Toggle sort ── */
  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const SortArrow = ({ k }) => {
    if (sortBy !== k) return <span className="sort-arrow">↕</span>;
    return <span className="sort-arrow sort-arrow--active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  /* ─── Alternar status na planilha ── */
  const handleToggleStatus = async (item, idx) => {
    const novoStatus = item.situacao === "Pago" ? "Pendente" : "Pago";
    setToggling(idx);
    try {
      await updateStatus("gastos_variaveis", { id: item.id }, novoStatus);
      toast.success(`"${item.descricao}" marcado como ${novoStatus}.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao atualizar status: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── Excluir da planilha ── */
  const handleDelete = async (item, idx) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${item.descricao}"?`)) return;

    setToggling(idx);
    try {
      await deleteRow("gastos_variaveis", { id: item.id });
      toast.success(`"${item.descricao}" foi excluído com sucesso.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── KPIs ── */
  const total     = data.reduce((s, g) => s + g.valor, 0);
  const totalPend = data.filter(g => g.situacao === "Pendente").reduce((s, g) => s + g.valor, 0);

  const catData = Object.entries(
    data.reduce((acc, g) => { acc[g.categoria] = (acc[g.categoria] || 0) + g.valor; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const cardData = Object.entries(
    data.reduce((acc, g) => { acc[g.pagamento || "Outros"] = (acc[g.pagamento || "Outros"] || 0) + g.valor; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-16">
      {/* KPIs */}
      <div className="grid-kpi">
        {[
          { label: "Total Variável", value: fmt(total),     color: "amber" },
          { label: "Pendente",       value: fmt(totalPend), color: "red"   },
          { label: "Lançamentos",    value: data.length,    color: "blue"  },
          { label: "Maior Cat.",     value: catData[0]?.name || "—", color: "green" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabela + gráfico */}
      <div className="grid-sidebar">
        <div className="card card--flat">
          {/* Header */}
          <div className="tbl-header">
            <span className="tbl-header__title">Lançamentos do Mês</span>
            <button className="btn btn--red" onClick={onAdd}>+ Adicionar</button>
          </div>

          {/* Busca + Filtros */}
          <div className="tbl-toolbar">
            <input
              className="tbl-search"
              type="text"
              placeholder="🔍 Buscar por descrição, categoria ou pagamento…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="filter-group">
              {FILTROS.map(f => (
                <button
                  key={f.key}
                  className={`filter-btn${f.color ? ` filter-btn--${f.color}` : ""}${filtro === f.key ? " filter-btn--active" : ""}`}
                  onClick={() => setFiltro(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela */}
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort("categoria")}>Categoria <SortArrow k="categoria" /></th>
                  <th>Descrição</th>
                  <th className="sortable" onClick={() => handleSort("valor")}>Valor <SortArrow k="valor" /></th>
                  <th className="sortable" onClick={() => handleSort("parcela")}>Parcela <SortArrow k="parcela" /></th>
                  <th>Pagamento</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 12 }}>
                      Nenhum resultado encontrado.
                    </td>
                  </tr>
                ) : sorted.map((g, i) => {
                  const vencido = isOverdue(g.parcela, g.situacao);
                  const isToggling = toggling === i;
                  return (
                    <tr key={i} className={vencido ? "row-overdue" : ""} title={vencido ? "⚠ Parcela vencida!" : undefined}>
                      <td><CatBadge name={g.categoria} /></td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {g.descricao}
                        {vencido && (
                          <span style={{ marginLeft: 6, fontSize: 9, color: "#fff", background: "var(--red)", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>VENCIDO</span>
                        )}
                      </td>
                      <td className="val val--red">{fmt(g.valor)}</td>
                      <td style={{ color: vencido ? "var(--red)" : "var(--text-muted)", fontSize: 11, fontWeight: vencido ? 700 : 400 }}>
                        {fmtDate(g.parcela)}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {g.pagamento || "—"}
                      </td>
                      <td style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                        <StatusToggle
                          status={g.situacao}
                          loading={isToggling}
                          onChange={() => handleToggleStatus(g, i)}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => onEdit(g)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={isToggling}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(g, i)}
                            title="Excluir"
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={isToggling}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="tbl__total">
                  <td colSpan={2}>TOTAL ({sorted.length}/{data.length})</td>
                  <td className="val val--red">{fmt(sorted.reduce((s, g) => s + g.valor, 0))}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráficos */}
        <div className="flex flex-col gap-16">
          <div className="card">
            <div className="sec-header"><span className="sec-header__title">Por Categoria</span></div>
            <ResponsiveContainer width="100%" height={Math.max(catData.length * 36, 120)}>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4d6478", fontSize: 9 }} tickFormatter={v => "R$" + v} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8fa3b8", fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                  {catData.map((e, i) => <Cell key={i} fill={COLORS[e.name] || `hsl(${i * 55},65%,58%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="sec-header"><span className="sec-header__title">Resumo por Cartão</span></div>
            {cardData.map(([card, t]) => (
              <div className="legend-item" key={card}>
                <div className="legend-item__left">
                  <div className="legend-item__dot" style={{ background: card.includes("Inter") ? "#22d3ee" : "#a855f7" }} />
                  <span className="legend-item__name">{card}</span>
                </div>
                <span className="legend-item__value">{fmt(t)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatBadge({ name }) {
  const colors = { Casa: "#22d3ee", Alimentação: "#34d399", Transporte: "#4f9cf9", Lazer: "#f59e0b", Saúde: "#f4645f", Vestuário: "#f87171", Outros: "#64748b" };
  const c = colors[name] || "#64748b";
  return <span className="badge" style={{ background: c + "22", color: c }}>{name}</span>;
}
