/**
 * Toast.jsx — Sistema de notificações global (sem bibliotecas externas).
 *
 * Uso:
 *   1. Envolva o app em <ToastProvider>
 *   2. Em qualquer componente: const { toast } = useToast()
 *   3. Chame: toast.success("msg") | toast.error("msg") | toast.warning("msg") | toast.info("msg")
 */
import { createContext, useCallback, useContext, useState } from "react";

/* ─── Context ── */
const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => add("success", msg, dur),
    error:   (msg, dur) => add("error",   msg, dur),
    warning: (msg, dur) => add("warning", msg, dur),
    info:    (msg, dur) => add("info",    msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}

/* ─── Icons ── */
const ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

/* ─── Container ── */
function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <span className="toast__icon">{ICONS[t.type]}</span>
          <span className="toast__msg">{t.message}</span>
          <button className="toast__close" onClick={() => onRemove(t.id)} aria-label="Fechar">×</button>
        </div>
      ))}
    </div>
  );
}
