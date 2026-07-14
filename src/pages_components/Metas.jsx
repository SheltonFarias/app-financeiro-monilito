import { fmt } from "../utils/format";

export default function Metas({ data = [], onAdd, onEdit }) {
  return (
    <div className="flex flex-col gap-16">
      <div className="card card--flat">
        <div className="tbl-header">
          <span className="tbl-header__title">Metas de Economia</span>
          <button className="btn btn--teal btn--sm" onClick={onAdd}>+ Nova Meta</button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, padding: "16px 0" }}>
          {data.map((m, i) => {
            const p = m.valor_alvo > 0 ? (m.valor_atual / m.valor_alvo) * 100 : 0;
            const pctVal = Math.min(p, 100).toFixed(1);
            
            return (
              <div key={m.id} style={{
                background: "var(--surface)", border: "1px solid var(--hairline)",
                borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, color: "var(--text-primary)" }}>{m.titulo}</h4>
                    {m.descricao && <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{m.descricao}</p>}
                  </div>
                  <button onClick={() => onEdit(m)} style={{
                    background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14
                  }}>⚙️</button>
                </div>
                
                <div className="progress-track" style={{ height: 12, borderRadius: 6, background: "var(--canvas-soft)" }}>
                  <div className="progress-fill" style={{ width: pctVal + "%", background: "var(--teal)", borderRadius: 6 }} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Atual: </span>
                    <strong style={{ color: "var(--teal)" }}>{fmt(m.valor_atual)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Alvo: </span>
                    <strong style={{ color: "var(--text-primary)" }}>{fmt(m.valor_alvo)}</strong>
                  </div>
                </div>
                
                <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  {pctVal}% Concluído {m.data_limite ? ` • Prazo: ${m.data_limite}` : ""}
                </div>
              </div>
            );
          })}
          
          {data.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
              Nenhuma meta cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
