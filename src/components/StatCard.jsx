/**
 * StatCard — Card de KPI com ícone, label, valor e glow decorativo.
 */
export default function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value" style={{ color: accent || "var(--text-primary)" }}>
        {value}
      </div>
      {sub && <div className="stat-card__sub">{sub}</div>}
      <div
        className="stat-card__glow"
        style={{ background: accent || "rgba(255,255,255,0.03)" }}
      />
    </div>
  );
}
