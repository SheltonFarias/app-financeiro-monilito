/**
 * StatusToggle — Toggle clicável para marcar Pago/Pendente/Recebido.
 * Suporta prop `loading` para desabilitar enquanto salva na planilha.
 */
export default function StatusToggle({ status, onChange, loading }) {
  const s = (status || "Pendente").toLowerCase();

  const handleClick = () => {
    if (!onChange || loading) return;
    if (s === "pendente") onChange("Pago");
    else if (s === "pago") onChange("Pendente");
    else if (s === "recebido") onChange("Pendente");
    else onChange("Pago");
  };

  const classMap = {
    pago:     "status-toggle--pago",
    pendente: "status-toggle--pendente",
    recebido: "status-toggle--recebido",
  };

  const labelMap = {
    pago:     "Pago",
    pendente: "Pendente",
    recebido: "Recebido",
  };

  return (
    <button
      className={`status-toggle ${classMap[s] || "status-toggle--pendente"}${loading ? " status-toggle--loading" : ""}`}
      onClick={handleClick}
      type="button"
      disabled={loading}
      title={loading ? "Salvando…" : "Clique para alternar status"}
    >
      <span className="status-toggle__dot" />
      {loading ? "…" : (labelMap[s] || status)}
    </button>
  );
}
