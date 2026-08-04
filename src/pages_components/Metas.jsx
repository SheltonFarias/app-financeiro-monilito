import { useState } from "react";
import { fmt } from "../utils/format";
import { apiFetch, deleteMeta } from "../utils/apiService";
import { useToast } from "../components/Toast";

/**
 * Calcula quantos meses restam entre hoje e uma data "YYYY-MM-DD".
 * Retorna null se não houver data ou se já passou.
 */
function calcularMesesRestantes(dataLimite) {
  if (!dataLimite) return null;
  const limite = new Date(dataLimite);
  const hoje   = new Date();
  const diffAnos  = limite.getFullYear() - hoje.getFullYear();
  const diffMeses = limite.getMonth()    - hoje.getMonth();
  const total = diffAnos * 12 + diffMeses;
  return total > 0 ? total : null;
}

/**
 * Formata "YYYY-MM-DD" em "DD/MM/AAAA".
 */
function fmtData(iso) {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

export default function Metas({ data = [], onAdd, onEdit, refetch, mesAtual }) {
  const [ativando,  setAtivando]  = useState(null);
  const [deletando, setDeletando] = useState(null);
  const { toast } = useToast();

  const handleAtivar = async (meta) => {
    if (!window.confirm(
      `Ativar contribuição mensal automática para "${meta.titulo}"?\n\n` +
      `Um Gasto Variável mensal recorrente será criado automaticamente.`
    )) return;

    setAtivando(meta.id);
    try {
      const res = await apiFetch(`/api/metas/${meta.id}/ativar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesAtual }),
      });
      const contrib = fmt(res.data?.contribuicao_mensal || 0);
      const meses   = res.data?.meses_restantes || 0;
      toast.success(`Contribuição ativada! ${contrib}/mês por ${meses} meses.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao ativar: " + err.message);
    } finally {
      setAtivando(null);
    }
  };

  const handleDesativar = async (meta) => {
    if (!window.confirm(`Desativar a contribuição mensal de "${meta.titulo}"?`)) return;

    setAtivando(meta.id);
    try {
      await apiFetch(`/api/metas/${meta.id}/ativar`, { method: 'DELETE' });
      toast.success(`Contribuição de "${meta.titulo}" desativada.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao desativar: " + err.message);
    } finally {
      setAtivando(null);
    }
  };

  const handleDelete = async (meta) => {
    if (!window.confirm(
      `Tem certeza que deseja excluir a meta "${meta.titulo}"?\n\nEsta ação não pode ser desfeita.`
    )) return;

    setDeletando(meta.id);
    try {
      await deleteMeta(meta.id);
      toast.success(`Meta "${meta.titulo}" excluída com sucesso.`);
      refetch?.();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeletando(null);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="card card--flat">
        <div className="tbl-header">
          <span className="tbl-header__title">Metas de Economia</span>
          <button className="btn btn--teal btn--sm" onClick={onAdd}>+ Nova Meta</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, padding: "16px 0" }}>
          {data.map((m) => {
            const p = m.valor_alvo > 0 ? (m.valor_atual / m.valor_alvo) * 100 : 0;
            const pctVal = Math.min(p, 100).toFixed(1);
            const falta  = Math.max((m.valor_alvo || 0) - (m.valor_atual || 0), 0);
            const mesesRestantes = calcularMesesRestantes(m.data_limite);
            const contribuicaoMensal = mesesRestantes && falta > 0
              ? Math.ceil((falta / mesesRestantes) * 100) / 100
              : null;
            const isAtivando = ativando === m.id;
            const atingida   = falta <= 0;

            return (
              <div key={m.id} style={{
                background: "var(--surface)", border: "1px solid var(--hairline)",
                borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14,
                position: "relative", overflow: "hidden",
              }}>
                {/* Barra de destaque no topo */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: atingida
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, var(--teal), #0ea5e9)",
                  borderRadius: "14px 14px 0 0",
                }} />

                {/* Cabeçalho */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 15, color: "var(--text-primary)", fontWeight: 700 }}>
                      {atingida && <span title="Meta atingida!" style={{ marginRight: 6 }}>🎉</span>}
                      {m.titulo}
                    </h4>
                    {m.descricao && (
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{m.descricao}</p>
                    )}
                  </div>
                  {/* Ações do card */}
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => onEdit(m)}
                      title="Editar meta"
                      style={{
                        background: "transparent", border: "none", color: "var(--text-muted)",
                        cursor: "pointer", fontSize: 14, padding: 4, borderRadius: 6,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                    >⚙️</button>
                    <button
                      onClick={() => handleDelete(m)}
                      title="Excluir meta"
                      disabled={deletando === m.id}
                      style={{
                        background: "transparent", border: "none",
                        color: deletando === m.id ? "var(--text-muted)" : "rgba(239,68,68,0.5)",
                        cursor: deletando === m.id ? "not-allowed" : "pointer",
                        fontSize: 14, padding: 4, borderRadius: 6,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => { if (deletando !== m.id) e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={e => { if (deletando !== m.id) e.currentTarget.style.color = "rgba(239,68,68,0.5)"; }}
                    >
                      {deletando === m.id ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                    <span>{pctVal}% concluído</span>
                    {m.data_limite && <span>📅 {fmtData(m.data_limite)}</span>}
                  </div>
                  <div style={{ height: 10, borderRadius: 6, background: "var(--canvas-soft)", overflow: "hidden" }}>
                    <div style={{
                      width: pctVal + "%",
                      height: "100%",
                      background: atingida
                        ? "linear-gradient(90deg, #22c55e, #16a34a)"
                        : "linear-gradient(90deg, var(--teal), #0ea5e9)",
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>

                {/* Indicadores financeiros */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "var(--canvas-soft)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Arrecadado</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--teal)" }}>{fmt(m.valor_atual || 0)}</div>
                  </div>
                  <div style={{ background: "var(--canvas-soft)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Alvo</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{fmt(m.valor_alvo || 0)}</div>
                  </div>
                  {!atingida && (
                    <div style={{ background: "var(--canvas-soft)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Falta</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--red, #ef4444)" }}>{fmt(falta)}</div>
                    </div>
                  )}
                  {contribuicaoMensal && !atingida && (
                    <div style={{ background: "var(--canvas-soft)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sugerido/mês</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b" }}>{fmt(contribuicaoMensal)}</div>
                    </div>
                  )}
                </div>

                {/* Info de meses restantes */}
                {mesesRestantes && !atingida && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                    {mesesRestantes} {mesesRestantes === 1 ? "mês restante" : "meses restantes"}
                  </div>
                )}

                {/* Botão de contribuição */}
                {!atingida && (
                  m.contribuicao_ativa === 1 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
                        background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)",
                        borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--teal)", fontWeight: 600,
                      }}>
                        ✅ Contribuição mensal ativa
                      </div>
                      <button
                        onClick={() => handleDesativar(m)}
                        disabled={isAtivando}
                        style={{
                          background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                          color: "rgba(239,68,68,0.7)", borderRadius: 8, padding: "6px 10px",
                          fontSize: 11, cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.7)"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
                      >
                        Desativar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAtivar(m)}
                      disabled={isAtivando || !contribuicaoMensal}
                      title={!contribuicaoMensal ? "Defina uma data limite para calcular a contribuição" : "Criar gasto variável mensal automático"}
                      style={{
                        padding: "10px 16px", borderRadius: 10,
                        background: contribuicaoMensal
                          ? "linear-gradient(135deg, var(--teal), #0ea5e9)"
                          : "var(--canvas-soft)",
                        border: "none",
                        color: contribuicaoMensal ? "white" : "var(--text-muted)",
                        fontSize: 13, fontWeight: 600, cursor: contribuicaoMensal ? "pointer" : "not-allowed",
                        opacity: isAtivando ? 0.6 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {isAtivando ? "Ativando…" : (
                        contribuicaoMensal
                          ? `💰 Ativar contribuição (${fmt(contribuicaoMensal)}/mês)`
                          : "Defina uma data limite"
                      )}
                    </button>
                  )
                )}

                {atingida && (
                  <div style={{
                    textAlign: "center", fontSize: 13, color: "#22c55e", fontWeight: 600,
                    background: "rgba(34,197,94,0.1)", borderRadius: 10, padding: "10px",
                  }}>
                    🎉 Meta atingida!
                  </div>
                )}
              </div>
            );
          })}

          {data.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div>Nenhuma meta cadastrada.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
