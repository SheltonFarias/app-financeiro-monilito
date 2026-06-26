/**
 * Badge — Rótulo colorido para categorias e tipos.
 */
import { COLORS } from "../utils/format";

export default function Badge({ label, color }) {
  const c = color || COLORS[label] || "#60a5fa";
  return (
    <span
      className="badge"
      style={{
        background: c + "22",
        color: c,
        border: `1px solid ${c}44`,
      }}
    >
      {label}
    </span>
  );
}
