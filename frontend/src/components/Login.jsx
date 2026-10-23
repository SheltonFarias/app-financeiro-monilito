/**
 * Login.jsx — Tela de autenticação do Financeiro 2026.
 * Design dark/glass com animações suaves, matching ao tema do dashboard.
 */
import { useState, useEffect, useRef } from "react";

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [erro,     setErro]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shake,    setShake]    = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!senha) {
      triggerErro("Preencha a senha.");
      return;
    }
    setLoading(true);
    setErro("");

    const result = await onLogin(email.trim(), senha);
    if (!result.ok) {
      setLoading(false);
      triggerErro(result.error || "Senha incorreta.");
    }
    // Se ok, o componente pai vai desmontar este Login
  };

  const triggerErro = (msg) => {
    setErro(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div style={styles.overlay}>
      {/* Partículas de fundo decorativas */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />
      <div style={styles.bgOrb3} />

      {/* Card de login */}
      <div style={{ ...styles.card, animation: "loginSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        {/* Logo / Cabeçalho */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>💰</div>
          <div style={styles.logoTitle}>
            Financeiro<span style={{ color: "var(--teal, #2dd4bf)" }}>2026</span>
          </div>
          <div style={styles.logoSub}>Controle Financeiro Pessoal</div>
        </div>

        {/* Divisor */}
        <div style={styles.divider} />

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate
          style={{ ...styles.form, ...(shake ? styles.shake : {}) }}
        >
          <h2 style={styles.formTitle}>Acesso ao Dashboard</h2>

          {/* Campo E-mail */}
          <div style={styles.fieldWrap}>
            <label style={styles.label} htmlFor="login-email">E-mail</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>✉️</span>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => { setEmail(e.target.value); setErro(""); }}
                placeholder="seu@email.com"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div style={styles.fieldWrap}>
            <label style={styles.label} htmlFor="login-senha">Senha</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                id="login-senha"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(""); }}
                placeholder="••••••••"
                style={{ ...styles.input, paddingRight: 44 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
                title={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div style={styles.errorBox}>
              <span>⚠️</span> {erro}
            </div>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <span style={styles.spinner} /> Verificando…
              </span>
            ) : (
              "Entrar no Dashboard →"
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div style={styles.footer}>
          <div style={styles.footerDot}>
            <div style={styles.footerDotCircle} />
            Sessão segura · Dados locais
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loginSlideIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes spinAnim {
          to { transform: rotate(360deg); }
        }
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px,-20px) scale(1.05); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-20px,30px) scale(1.08); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(15px,15px) scale(0.95); }
        }
        @keyframes shakeAnim {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
        #login-email:focus, #login-senha:focus {
          outline: none;
          border-color: #2dd4bf !important;
          box-shadow: 0 0 0 3px rgba(45,212,191,0.15) !important;
        }
        #login-email::placeholder, #login-senha::placeholder {
          color: rgba(255,255,255,0.25);
        }
      `}</style>
    </div>
  );
}

/* ─── Estilos inline (evita conflito com index.css do dashboard) ── */
const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "linear-gradient(135deg, #0d1520 0%, #0f1f30 40%, #0a1628 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: "hidden",
    zIndex: 9999,
  },
  bgOrb1: {
    position: "absolute", width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)",
    top: "-150px", left: "-200px",
    animation: "orbFloat1 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  bgOrb2: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(79,156,249,0.10) 0%, transparent 70%)",
    bottom: "-100px", right: "-150px",
    animation: "orbFloat2 10s ease-in-out infinite",
    pointerEvents: "none",
  },
  bgOrb3: {
    position: "absolute", width: 300, height: 300, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
    top: "40%", right: "20%",
    animation: "orbFloat3 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1,
    width: "100%", maxWidth: 420,
    background: "rgba(15,31,48,0.85)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: "36px 36px 28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  logoArea: {
    textAlign: "center", marginBottom: 24,
  },
  logoIcon: {
    fontSize: 44, lineHeight: 1, marginBottom: 12,
    filter: "drop-shadow(0 0 16px rgba(45,212,191,0.4))",
  },
  logoTitle: {
    fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px",
    color: "#e2eaf4", fontFamily: "'Inter', sans-serif",
  },
  logoSub: {
    fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4,
    letterSpacing: "0.5px", textTransform: "uppercase",
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 28,
  },
  form: {
    display: "flex", flexDirection: "column", gap: 18,
  },
  shake: {
    animation: "shakeAnim 0.5s ease-in-out",
  },
  formTitle: {
    fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.6)",
    margin: 0, textAlign: "center", letterSpacing: "0.2px",
  },
  fieldWrap: {
    display: "flex", flexDirection: "column", gap: 7,
  },
  label: {
    fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.5px", textTransform: "uppercase",
  },
  inputWrap: {
    position: "relative", display: "flex", alignItems: "center",
  },
  inputIcon: {
    position: "absolute", left: 14, fontSize: 15,
    pointerEvents: "none", zIndex: 1,
    filter: "grayscale(0.3) opacity(0.7)",
  },
  input: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 14px 12px 42px",
    color: "#e2eaf4", fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeBtn: {
    position: "absolute", right: 12,
    background: "transparent", border: "none",
    cursor: "pointer", fontSize: 16, padding: 4,
    opacity: 0.6, transition: "opacity 0.2s",
    lineHeight: 1,
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(244,100,95,0.12)",
    border: "1px solid rgba(244,100,95,0.3)",
    borderRadius: 8, padding: "10px 14px",
    fontSize: 13, color: "#f4645f", fontWeight: 500,
  },
  submitBtn: {
    background: "linear-gradient(135deg, #2dd4bf 0%, #1ca08a 100%)",
    border: "none", borderRadius: 10, padding: "14px 20px",
    color: "#0d1520", fontSize: 14, fontWeight: 700,
    letterSpacing: "0.3px", cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s, opacity 0.2s",
    boxShadow: "0 4px 20px rgba(45,212,191,0.35)",
    marginTop: 4,
    width: "100%",
  },
  loadingRow: {
    display: "inline-flex", alignItems: "center", gap: 10,
  },
  spinner: {
    display: "inline-block",
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid rgba(13,21,32,0.3)",
    borderTopColor: "#0d1520",
    animation: "spinAnim 0.7s linear infinite",
  },
  footer: {
    marginTop: 24, textAlign: "center",
  },
  footerDot: {
    display: "inline-flex", alignItems: "center", gap: 7,
    fontSize: 11, color: "rgba(255,255,255,0.25)",
  },
  footerDotCircle: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#2dd4bf",
    boxShadow: "0 0 6px #2dd4bf",
    animation: "none",
  },
};
