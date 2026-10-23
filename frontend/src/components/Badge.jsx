/**
 * Badge — Rótulo colorido para categorias e tipos.
 */
import { COLORS } from "../utils/format";

export default function Badge({ label, color }) {
  const c = color || COLORS[label] || "#2a9d99"; // accent-teal
  return (
    <span
      className="badge"
      style={{
        background: c + "1A",
        color: c,
        border: `1px solid ${c}33`,
      }}
    >
      {label}
    </span>
  );
}
