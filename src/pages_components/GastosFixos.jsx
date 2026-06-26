/**
 * GastosFixos — Tabela de compromissos fixos com gráfico por categoria.
 * Feature 3: Linhas com contas vencidas piscam em vermelho.
 * Feature 4: Busca por descrição/categoria + filtros rápidos de situação.
 * Feature 7: Ordenação automática (vencidos primeiro, depois por vencimento).
 * Feature 1b: StatusToggle clicável que salva na planilha via updateStatus().
 */
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, COLORS, fmtDate, isOverdue } from "../utils/format";
import { updateStatus, deleteRow } from "../utils/apiService";
import { useToast } from "../components/Toast";
import StatusToggle from "../components/StatusToggle";

const FILTROS = [
  { key: "todos",    label: "Todos",    color: "" },
  { key: "pendente", label: "Pendente", color: "red" },
  { key: "pago",     label: "Pago",     color: "green" },
  { key: "vencidos", label: "Vencidos ⚠", color: "amber" },
];

const SORT_OPTIONS = [
  { key: "vencimento", label: "Vencimento" },
  { key: "valor",      label: "Valor" },
  { key: "categoria",  label: "Categoria" },
];

export default function GastosFixos({ data, onAdd, onEdit, refetch }) {
  const [search,  setSearch]  = useState("");
  const [filtro,  setFiltro]  = useState("todos");
  const [sortBy,  setSortBy]  = useState("vencimento");
  const [sortDir, setSortDir] = useState("asc");
  const [toggling, setToggling] = useState(null); // id da linha sendo alterada

  const { toast } = useToast();

  /* ─── Filtragem ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(g => {
      const matchSearch = !q ||
        g.descricao.toLowerCase().includes(q) ||
        g.categoria.toLowerCase().includes(q);

      const matchFiltro =
        filtro === "todos"    ? true :
        filtro === "pendente" ? g.situacao === "Pendente" :
        filtro === "pago"     ? g.situacao === "Pago" :
        filtro === "vencidos" ? isOverdue(g.vencimento, g.situacao) :
        true;

      return matchSearch && matchFiltro;
    });
  }, [data, search, filtro]);

  /* ─── Ordenação ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Vencidos sempre no topo (independente da ordenação)
      const aVencido = isOverdue(a.vencimento, a.situacao);
      const bVencido = isOverdue(b.vencimento, b.situacao);
      if (aVencido !== bVencido) return aVencido ? -1 : 1;

      // Ordenação pelo campo escolhido
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (sortBy === "valor") {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortBy === "vencimento") {
        // Datas válidas primeiro
        const dA = new Date(valA);
        const dB = new Date(valB);
        if (!isNaN(dA) && !isNaN(dB)) { valA = dA; valB = dB; }
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

  /* ─── Toggles de sort ── */
  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
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
      await updateStatus("gastos_fixos", { id: item.id }, novoStatus);
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
      await deleteRow("gastos_fixos", { id: item.id });
      toast.success(`"${item.descricao}" foi excluído com sucesso.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── KPIs ── */
  const total      = data.reduce((s, g) => s + g.valor, 0);
  const totalPago  = data.filter(g => g.situacao === "Pago").reduce((s, g) => s + g.valor, 0);
  const totalPend  = total - totalPago;
  const qtdPend    = data.filter(g => g.situacao === "Pendente").length;
  const qtdVencido = data.filter(g => isOverdue(g.vencimento, g.situacao)).length;

  const catData = Object.entries(
    data.reduce((acc, g) => { acc[g.categoria] = (acc[g.categoria] || 0) + g.valor; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-16">
      {/* KPIs */}
      <div className="grid-kpi">
        {[
          { label: "Total Fixo / Mês",  value: fmt(total),     color: "blue"  },
          { label: "Pago",              value: fmt(totalPago),  color: "green" },
          { label: "Pendente",          value: fmt(totalPend),  color: "red",   sub: `${qtdPend} itens restantes` },
          { label: qtdVencido > 0 ? `⚠ ${qtdVencido} Vencido(s)` : "Compromissos", value: data.length, color: qtdVencido > 0 ? "red" : "amber", sub: "lançamentos ativos" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
            {sub && <div className="kpi__sub">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabela + Gráfico */}
      <div className="grid-sidebar">
        <div className="card card--flat">
          {/* Header */}
          <div className="tbl-header">
            <span className="tbl-header__title">Compromissos Fixos</span>
            <button className="btn btn--teal" onClick={onAdd}>+ Adicionar</button>
          </div>

          {/* Busca + Filtros */}
          <div className="tbl-toolbar">
            <input
              className="tbl-search"
              type="text"
              placeholder="🔍 Buscar por descrição ou categoria…"
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
                  <th className="sortable" onClick={() => handleSort("vencimento")}>Vencimento <SortArrow k="vencimento" /></th>
                  <th className="sortable" onClick={() => handleSort("cartao")}>Cartão / Pessoa <SortArrow k="cartao" /></th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 12 }}>
                      Nenhum resultado encontrado.
                    </td>
                  </tr>
                ) : sorted.map((g, i) => {
                  const vencido = isOverdue(g.vencimento, g.situacao);
                  const isToggling = toggling === i;
                  return (
                    <tr
                      key={i}
                      className={vencido ? "row-overdue" : ""}
                      title={vencido ? "⚠ Esta conta está vencida!" : undefined}
                    >
                      <td><CatBadge name={g.categoria} /></td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {g.descricao}
                        {vencido && (
                          <span style={{
                            marginLeft: 6, fontSize: 9, color: "#fff",
                            background: "var(--red)", padding: "1px 5px",
                            borderRadius: 3, fontWeight: 700, animation: "pulseText 1.5s infinite",
                          }}>VENCIDO</span>
                        )}
                      </td>
                      <td className="val val--primary">{fmt(g.valor)}</td>
                      <td style={{
                        color: vencido ? "var(--red)" : "var(--text-muted)",
                        fontSize: 11, fontWeight: vencido ? 700 : 400,
                      }}>
                        {fmtDate(g.vencimento)}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                        {g.cartao || "—"}
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
                  <td className="val val--primary">{fmt(sorted.reduce((s, g) => s + g.valor, 0))}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico por categoria */}
        <div className="card">
          <div className="sec-header"><span className="sec-header__title">Por Categoria</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                dataKey="value" paddingAngle={3}>
                {catData.map((e, i) => (
                  <Cell key={i} fill={COLORS[e.name] || `hsl(${i * 55},65%,58%)`} />
                ))}
              </Pie>
              <Tooltip
                formatter={v => fmt(v)}
                contentStyle={{ background: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-8" style={{ marginTop: 8 }}>
            {catData.map((c, i) => (
              <div key={i} className="legend-item">
                <div className="legend-item__left">
                  <div className="legend-item__dot" style={{ background: COLORS[c.name] || `hsl(${i * 55},65%,58%)` }} />
                  <span className="legend-item__name">{c.name}</span>
                </div>
                <span className="legend-item__value">{fmt(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatBadge({ name }) {
  const colors = {
    Apartamento: "#4f9cf9", Casa: "#22d3ee", Educação: "#a78bfa",
    Lazer: "#f59e0b", Veiculo: "#fb923c", Outros: "#64748b",
    Saúde: "#f4645f", Trabalho: "#34d399",
  };
  const c = colors[name] || "#64748b";
  return <span className="badge" style={{ background: c + "22", color: c }}>{name}</span>;
}
