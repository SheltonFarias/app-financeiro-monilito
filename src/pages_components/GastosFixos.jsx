/**
 * GastosFixos — Tabela de compromissos fixos com gráfico por categoria.
 * Feature 3: Linhas com contas vencidas piscam em vermelho.
 * Feature 4: Busca por descrição/categoria + filtros rápidos de situação.
 * Feature 7: Ordenação automática (vencidos primeiro, depois por vencimento).
 * Feature 1b: StatusToggle clicável que salva na planilha via updateStatus().
 */
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmt, COLORS } from "../utils/format";
import { updateStatus, deleteRow, deleteGastoFixoSerie } from "../utils/apiService";
import { useToast } from "../components/Toast";
import StatusToggle from "../components/StatusToggle";

/**
 * Verifica se um gasto fixo com vencimento numérico (dia do mês) está vencido.
 * Considera vencido se o dia já passou no mês atual e a situação é Pendente.
 */
function isDayOverdue(vencimento, situacao) {
  if (situacao === "Pago") return false;
  const dia = parseInt(vencimento, 10);
  if (isNaN(dia) || dia <= 0) return false;
  const hoje = new Date();
  return dia < hoje.getDate();
}

/** Exibe o dia do vencimento de forma legível */
function fmtVencimento(vencimento) {
  const dia = parseInt(vencimento, 10);
  if (isNaN(dia) || dia <= 0) return vencimento || "—";
  return `Dia ${dia}`;
}

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

/** SortArrow extraído para fora do componente — evita recriação a cada render */
function SortArrow({ k, sortBy, sortDir }) {
  if (sortBy !== k) return <span className="sort-arrow">↕</span>;
  return <span className="sort-arrow sort-arrow--active">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function GastosFixos({ data, onAdd, onEdit, refetch }) {
  const [search,  setSearch]  = useState("");
  const [filtro,  setFiltro]  = useState("todos");
  const [sortBy,  setSortBy]  = useState("vencimento");
  const [sortDir, setSortDir] = useState("asc");
  const [toggling, setToggling] = useState(null); // id da linha sendo alterada
  const [deleteModal, setDeleteModal] = useState(null); // { item }

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
        filtro === "vencidos" ? isDayOverdue(g.vencimento, g.situacao) :
        true;

      return matchSearch && matchFiltro;
    });
  }, [data, search, filtro]);

  /* ─── Ordenação ── */
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Vencidos sempre no topo (independente da ordenação)
      const aVencido = isDayOverdue(a.vencimento, a.situacao);
      const bVencido = isDayOverdue(b.vencimento, b.situacao);
      if (aVencido !== bVencido) return aVencido ? -1 : 1;

      // Ordenação pelo campo escolhido
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (sortBy === "valor") {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortBy === "vencimento") {
        // Ordena numericamente pelo dia
        valA = parseInt(valA, 10) || 0;
        valB = parseInt(valB, 10) || 0;
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

  /* ─── Alternar status na planilha ── */
  const handleToggleStatus = async (item) => {
    const novoStatus = item.situacao === "Pago" ? "Pendente" : "Pago";
    setToggling(item.id);
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
  const handleDelete = async (item) => {
    const isRecorrente = item.data_fim || item.template_id || item.mensal === 1;
    if (isRecorrente) {
      // Abre modal elegante para recorrentes
      setDeleteModal({ item });
      return;
    }
    // Gasto avulso — comportamento original
    if (!window.confirm(`Tem certeza que deseja excluir "${item.descricao}"?`)) return;
    setToggling(item.id);
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

  /* ─── Excluir só este mês (recorrente) ── */
  const handleDeleteSingle = async () => {
    const { item } = deleteModal;
    setDeleteModal(null);
    setToggling(item.id);
    try {
      await deleteRow("gastos_fixos", { id: item.id });
      toast.success(`"${item.descricao}" excluído somente deste mês.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── Excluir toda a série (template + cópias) ── */
  const handleDeleteSerie = async () => {
    const { item } = deleteModal;
    setDeleteModal(null);
    setToggling(item.id);
    try {
      const templateId = item.template_id ?? item.id;
      await deleteGastoFixoSerie(templateId);
      toast.success(`Série "${item.descricao}" excluída por completo.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir série: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  /* ─── KPIs ── */
  const total      = data.reduce((s, g) => s + g.valor, 0);
  const totalPago  = data.filter(g => g.situacao === "Pago").reduce((s, g) => s + g.valor, 0);
  const totalPend  = total - totalPago;
  const qtdPend    = data.filter(g => g.situacao === "Pendente").length;
  const qtdVencido = data.filter(g => isDayOverdue(g.vencimento, g.situacao)).length;

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


      {/* Tabela — largura total */}
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
                  <th className="sortable" onClick={() => handleSort("categoria")}>Categoria <SortArrow k="categoria" sortBy={sortBy} sortDir={sortDir} /></th>
                  <th>Descrição</th>
                  <th className="sortable" onClick={() => handleSort("valor")}>Valor <SortArrow k="valor" sortBy={sortBy} sortDir={sortDir} /></th>
                  <th className="sortable" onClick={() => handleSort("vencimento")}>Vencimento <SortArrow k="vencimento" sortBy={sortBy} sortDir={sortDir} /></th>
                  <th className="sortable" onClick={() => handleSort("cartao")}>Forma de Pagamento <SortArrow k="cartao" sortBy={sortBy} sortDir={sortDir} /></th>
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
                ) : sorted.map((g) => {
                  const vencido = isDayOverdue(g.vencimento, g.situacao);
                  const isToggling = toggling === g.id;
                  return (
                    <tr
                      key={g.id ?? g.descricao}
                      className={vencido ? "row-overdue" : ""}
                      title={vencido ? "⚠ Esta conta está vencida!" : undefined}
                    >
                      <td><CatBadge name={g.categoria} /></td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {g.descricao}
                        {g.mensal === 1 && (
                          <span
                            title="♾️ Cobrança mensal — aparece em todos os meses"
                            style={{
                              marginLeft: 6, fontSize: 9, color: "#fff",
                              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                              padding: "1px 5px", borderRadius: 3, fontWeight: 700, cursor: "default",
                            }}
                          >
                            ♾️ MENSAL
                          </span>
                        )}
                        {!g.mensal && g.data_fim && (
                          <span
                            title={`🔁 Recorrente até ${g.data_fim}`}
                            style={{
                              marginLeft: 6, fontSize: 9, color: "#fff",
                              background: "#7c3aed", padding: "1px 5px",
                              borderRadius: 3, fontWeight: 700, cursor: "default",
                            }}
                          >
                            🔁 REC
                          </span>
                        )}
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
                        {fmtVencimento(g.vencimento)}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                        {g.cartao || "—"}
                      </td>
                      <td>
                        <StatusToggle
                          status={g.situacao}
                          loading={isToggling}
                          onChange={() => handleToggleStatus(g)}
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => onEdit(g)}
                            title="Editar"
                            aria-label={`Editar ${g.descricao}`}
                            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.7 }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                            disabled={isToggling}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(g)}
                            title="Excluir"
                            aria-label={`Excluir ${g.descricao}`}
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
              <div key={c.name} className="legend-item">
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
              Excluir gasto recorrente
            </p>
            <p style={{ color: "var(--ink-muted)", fontSize: 13, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>"{deleteModal.item.descricao}"</strong> é um gasto fixo recorrente.
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
  const c = COLORS[name] || "#2a9d99"; // accent-teal
  return <span className="badge" style={{ background: c + "1A", color: c, borderColor: c + "33" }}>{name}</span>;
}
