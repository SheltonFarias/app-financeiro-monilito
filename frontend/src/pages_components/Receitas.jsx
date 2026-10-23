/**
 * Receitas — Tabela de receitas do mês com CRUD completo.
 * Busca por descrição/categoria + filtros de situação.
 * Ordenação por valor/descrição/categoria.
 * StatusToggle clicável, editar e excluir via Apps Script.
 */
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, COLORS } from "../utils/format";
import { updateStatus, deleteRow, deleteReceitaSerie } from "../utils/apiService";
import { useToast } from "../components/Toast";
import StatusToggle from "../components/StatusToggle";

const FILTROS = [
  { key: "todos",     label: "Todos",     color: "" },
  { key: "pendente",  label: "Pendente",  color: "red" },
  { key: "recebido",  label: "Recebido",  color: "green" },
];

export default function Receitas({ data, onAdd, onEdit, refetch }) {
  const [search,   setSearch]   = useState("");
  const [filtro,   setFiltro]   = useState("todos");
  const [sortBy,   setSortBy]   = useState("valor");
  const [sortDir,  setSortDir]  = useState("desc");
  const [toggling, setToggling] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { item, idx }

  const { toast } = useToast();

  /* ─── Filtragem ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter(r => {
      const matchSearch = !q ||
        r.descricao.toLowerCase().includes(q) ||
        r.categoria.toLowerCase().includes(q);

      const matchFiltro =
        filtro === "todos"    ? true :
        filtro === "pendente" ? r.situacao === "Pendente" :
        filtro === "recebido" ? r.situacao === "Recebido" :
        true;

      return matchSearch && matchFiltro;
    });
  }, [data, search, filtro]);

  /* ─── Ordenação ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";
      if (sortBy === "valor") { valA = Number(valA); valB = Number(valB); }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1  : -1;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

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
    const novoStatus = item.situacao === "Recebido" ? "Pendente" : "Recebido";
    setToggling(idx);
    try {
      await updateStatus("receitas", { id: item.id }, novoStatus);
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
    // Receita recorrente ou mensal — abre modal diferenciado
    if (item.template_id || (item.mensal === 1 || item.mensal === true) || (item.recorrente === 1 || item.recorrente === true)) {
      setDeleteModal({ item, idx });
      return;
    }
    // Receita avulsa — comportamento padrão
    if (!window.confirm(`Tem certeza que deseja excluir "${item.descricao}"?`)) return;
    setToggling(idx);
    try {
      await deleteRow("receitas", { id: item.id });
      toast.success(`"${item.descricao}" foi excluído com sucesso.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── Excluir só este mês ── */
  const handleDeleteSingle = async () => {
    const { item, idx } = deleteModal;
    setDeleteModal(null);
    setToggling(idx);
    try {
      await deleteRow("receitas", { id: item.id });
      toast.success(`Receita de "${item.descricao}" deste mês excluída.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── Excluir a série inteira (template + cópias) ── */
  const handleDeleteSerie = async () => {
    const { item, idx } = deleteModal;
    setDeleteModal(null);
    setToggling(idx);
    try {
      await deleteReceitaSerie(item.id);
      toast.success(`Série de "${item.descricao}" excluída de todos os meses.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir série: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── KPIs ── */
  const total      = data.reduce((s, r) => s + r.valor, 0);
  const recebido   = data.filter(r => r.situacao === "Recebido").reduce((s, r) => s + r.valor, 0);
  const pendente   = total - recebido;
  const qtdPend    = data.filter(r => r.situacao === "Pendente").length;

  /* ─── Gráfico por categoria ── */
  const catData = Object.entries(
    data.reduce((acc, r) => { acc[r.categoria] = (acc[r.categoria] || 0) + r.valor; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-16">
      {/* KPIs */}
      <div className="grid-kpi">
        {[
          { label: "Total Receitas",   value: fmt(total),    color: "teal"  },
          { label: "Recebido",         value: fmt(recebido), color: "green" },
          { label: "Pendente",         value: fmt(pendente), color: "red",   sub: `${qtdPend} aguardando` },
          { label: "Fontes",           value: data.length,   color: "blue",  sub: "lançamentos" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className={`kpi kpi--${color}`}>
            <div className="kpi__accent-bar" />
            <div className="kpi__label">{label}</div>
            <div className="kpi__value">{value}</div>
            {sub && <div className="kpi__sub">{sub}</div>}
          </div>
        ))}
      </div>


      {/* Tabela — largura total */}
      <div className="card card--flat">
          {/* Header */}
          <div className="tbl-header">
            <span className="tbl-header__title">Receitas do Mês</span>
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
                  <th className="sortable" onClick={() => handleSort("descricao")}>Descrição <SortArrow k="descricao" /></th>
                  <th className="sortable" onClick={() => handleSort("valor")}>Valor <SortArrow k="valor" /></th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 12 }}>
                      Nenhum resultado encontrado.
                    </td>
                  </tr>
                ) : sorted.map((r, i) => {
                  const isToggling = toggling === i;
                  return (
                    <tr key={i}>
                      <td><CatBadge name={r.categoria} /></td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {(r.recorrente === 1 || r.recorrente === true) && <span title="Receita Recorrente" style={{ marginRight: 6, fontSize: "0.9em" }}>🔁</span>}
                        {r.descricao}
                      </td>
                      <td className="val val--teal">{fmt(r.valor)}</td>
                      <td>
                        <StatusToggle
                          status={r.situacao}
                          loading={isToggling}
                          onChange={() => handleToggleStatus(r, i)}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => onEdit(r)}
                            title="Editar"
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={isToggling}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(r, i)}
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
                  <td className="val val--teal">{fmt(sorted.reduce((s, r) => s + r.valor, 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráfico por categoria — abaixo da tabela, largura total */}
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
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--hairline)", borderRadius: "var(--r-md)", fontSize: 12, boxShadow: "var(--shadow-1)" }}
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

      {/* Modal de confirmação de exclusão em série */}
      {deleteModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-xl)", padding: "32px 28px", maxWidth: 400, width: "90%",
            boxShadow: "var(--shadow-2)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>🗑️</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", textAlign: "center", marginBottom: 8 }}>
              Excluir receita recorrente
            </p>
            <p style={{ color: "var(--ink-muted)", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>&quot;{deleteModal.item.descricao}&quot;</strong> é uma receita mensal recorrente.
              <br/>Como deseja excluir?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn--red"
                style={{ width: "100%", padding: "10px 0", justifyContent: "center" }}
                onClick={handleDeleteSerie}
              >
                🗑️ Excluir série inteira (todos os meses)
              </button>
              <button
                className="btn"
                style={{ width: "100%", padding: "10px 0", justifyContent: "center",
                  background: "rgba(255,255,255,0.06)", border: "1px solid var(--hairline)" }}
                onClick={handleDeleteSingle}
              >
                Excluir só este mês
              </button>
              <button
                className="btn"
                style={{ width: "100%", padding: "8px 0", justifyContent: "center",
                  background: "transparent", border: "none", color: "var(--ink-muted)", fontSize: 13 }}
                onClick={() => setDeleteModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CatBadge({ name }) {
  const c = COLORS[name] || "#2a9d99"; // accent-teal fallback
  return <span className="badge" style={{ background: c + "1A", color: c, borderColor: c + "33" }}>{name}</span>;
}
