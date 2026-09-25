"use client";
import { useState, useEffect, useMemo } from "react";
import VisaoGeral from "../pages_components/VisaoGeral";
import GastosFixos from "../pages_components/GastosFixos";
import GastosVariaveis from "../pages_components/GastosVariaveis";
import Investimentos from "../pages_components/Investimentos";
import Receitas from "../pages_components/Receitas";
import Cartoes from "../pages_components/Cartoes";
import Metas from "../pages_components/Metas";
import Relatorios from "../pages_components/Relatorios";
import Configuracoes from "../pages_components/Configuracoes";
import Financiamentos from "../pages_components/Financiamentos";
import SimuladorAportes from "../pages_components/SimuladorAportes";
import Modal from "../components/Modal";
import Login from "../components/Login";
import { ToastProvider } from "../components/Toast";
import { useSheetData } from "../hooks/useSheetData";
import { getMesAtual, MESES } from "../utils/format";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { icon: "📊", label: "Visão Geral",      key: 0 },
  { icon: "📌", label: "Gastos Fixos",     key: 1 },
  { icon: "🛒", label: "Gastos Variáveis", key: 2 },
  { icon: "💰", label: "Receitas",         key: 3 },
  { icon: "🎯", label: "Metas",            key: 4 },
  { icon: "📈", label: "Relatórios",       key: 5 },
  { icon: "💼", label: "Investimentos",    key: 6 },
  { icon: "⚙️", label: "Configurações",    key: 7 },
  { icon: "🏠", label: "Financiamentos",   key: 8 },
  { icon: "🧮", label: "Simulador de Aportes", key: 9 },
];

/** Gera lista de meses disponíveis.
 *  Regra: exibe apenas o ano atual.
 *  Exceção: se o mês atual for Dezembro, também exibe todo o próximo ano.
 */
function gerarMeses(anoAtual, mesAtual) {
  const isDecembro = mesAtual?.startsWith("Dezembro");
  const anos = isDecembro ? [anoAtual, anoAtual + 1] : [anoAtual];
  return anos.flatMap(ano => MESES.map(m => m + ano));
}

export default function App() {
  const { isAuthenticated, isLoaded, login, logout } = useAuth();

  if (!isLoaded) return null;

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <ToastProvider>
      <AppInner logout={logout} />
    </ToastProvider>
  );
}

function AppInner({ logout }) {
  const [tab,          setTab]          = useState(0);
  const [modal,        setModal]        = useState(null);
  // Inicializado como null para evitar mismatch SSR/CSR — resolvido no useEffect
  const [mesAtual,     setMesAtual]     = useState(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [anoAtual,     setAnoAtual]     = useState(null);

  useEffect(() => {
    const ano = new Date().getFullYear();
    setAnoAtual(ano);
    setMesAtual(getMesAtual());
    // Abre a sidebar por padrão apenas se for desktop
    if (window.innerWidth > 900) {
      setSidebarOpen(true);
    }
  }, []);

  const mesesDisponiveis = useMemo(
    () => (anoAtual ? gerarMeses(anoAtual, mesAtual) : []),
    [anoAtual, mesAtual]
  );

  const { data, loading, error, refetch } = useSheetData(mesAtual);

  // Guard: mesAtual ainda não foi inicializado pelo useEffect
  const mesLabel = mesAtual
    ? mesAtual.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")
    : "";

  const closeSidebar = () => setSidebarOpen(false);

  if (loading) return (
    <div className={`shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
      <Sidebar tab={tab} setTab={setTab}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
        mesesDisponiveis={mesesDisponiveis}
        isOpen={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <div className="main">
        <Topbar mesAtual={mesAtual} mesLabel={mesLabel} setMesAtual={setMesAtual}
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout} />
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Carregando dados do servidor…</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className={`shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
      <Sidebar tab={tab} setTab={setTab}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
        mesesDisponiveis={mesesDisponiveis}
        isOpen={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <div className="main">
        <Topbar mesAtual={mesAtual} mesLabel={mesLabel} setMesAtual={setMesAtual}
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout} />
        <div className="error-state">
          <div className="error-state__icon">⚠️</div>
          <p className="error-state__title">Erro ao conectar com o backend</p>
          <p className="error-state__msg">{error}</p>
          <button className="btn btn--teal btn--lg" onClick={refetch}>Tentar novamente</button>
        </div>
      </div>
    </div>
  );

  const pages = [
    <VisaoGeral key="vg" data={data} onAddOrcamento={() => setModal({ tipo: "Orçamento" })} onEditOrcamento={(item) => setModal({ tipo: "Orçamento", item })} />,
    <GastosFixos key="gf" data={data.gastosFixos} onAdd={() => setModal({ tipo: "Gasto Fixo" })} onEdit={(item) => setModal({ tipo: "Gasto Fixo", item })} refetch={refetch} />,
    <GastosVariaveis key="gv" data={data.gastosVariaveis} onAdd={() => setModal({ tipo: "Gasto Variável" })} onEdit={(item) => setModal({ tipo: "Gasto Variável", item })} refetch={refetch} />,
    <Receitas key="rc" data={data.receitas} onAdd={() => setModal({ tipo: "Receita" })} onEdit={(item) => setModal({ tipo: "Receita", item })} refetch={refetch} />,
    <Metas key="mt" data={data.metas} onAdd={() => setModal({ tipo: "Meta" })} onEdit={(item) => setModal({ tipo: "Meta", item })} refetch={refetch} mesAtual={mesAtual} />,
    <Relatorios key="rel" mesAtual={mesAtual} />,
    <Investimentos key="inv" data={data.investimentos} onAdd={() => setModal({ tipo: "Investimento" })} onEdit={(item) => setModal({ tipo: "Investimento", item })} refetch={refetch} />,
    <Configuracoes key="cfg" />,
    <Financiamentos key="fin" />,
    <SimuladorAportes key="sim-aportes" />,
  ];

  return (
    <div className={`shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
      <Sidebar tab={tab} setTab={(t) => { setTab(t); if (window.innerWidth <= 900) closeSidebar(); }}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
        mesesDisponiveis={mesesDisponiveis}
        isOpen={sidebarOpen} onClose={closeSidebar} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <div className="main">
        <Topbar mesAtual={mesAtual} mesLabel={mesLabel} setMesAtual={setMesAtual}
          sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout} />
        <div className="page-content">
          {pages[tab]}
        </div>
      </div>
      {modal && (
        <Modal tipo={modal.tipo} initialData={modal.item} mesAtual={mesAtual} onClose={() => setModal(null)}
          onSave={() => { setModal(null); refetch(); }} />
      )}
    </div>
  );
}

/* ─── Sidebar Component ── */
function Sidebar({ tab, setTab, mesAtual, setMesAtual, mesesDisponiveis, isOpen, onClose }) {
  return (
    <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-title">Financeiro<span>2026</span></div>
        <div className="sidebar__logo-sub">Controle Pessoal</div>
      </div>

      {/* Nav */}
      <div className="sidebar__section-label">Menu</div>
      <nav className="sidebar__nav">
        {NAV.map(({ icon, label, key }) => (
          <button
            key={key}
            className={`nav-item ${tab === key ? "nav-item--active" : ""}`}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
          >
            <span className="nav-item__icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Month selector in footer */}
      <div className="sidebar__section-label">Período</div>
      <div className="sidebar__month-wrap">
        <select
          className="sidebar__month-select"
          value={mesAtual || ""}
          onChange={(e) => setMesAtual(e.target.value)}
          aria-label="Selecionar mês"
        >
          {mesesDisponiveis.map(m => (
            <option key={m} value={m}>
              {m.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}
            </option>
          ))}
        </select>
      </div>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="status-dot">
          <div className="status-dot__circle" />
          Backend Local
        </div>
      </div>
    </aside>
  );
}

/* ─── Topbar Component ── */
function Topbar({ mesLabel, sidebarOpen, setSidebarOpen, logout }) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Hambúguer — visível apenas em mobile via CSS */}
        <button
          className={`hamburger${sidebarOpen ? " hamburger--open" : ""}`}
          onClick={() => setSidebarOpen(o => !o)}
          aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          title="Menu"
        >
          <span className="hamburger__bar" />
          <span className="hamburger__bar" />
          <span className="hamburger__bar" />
        </button>
        <div className="topbar__title">
          Financeiro <span>2026</span>
          {mesLabel && (
            <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>
              — {mesLabel}
            </span>
          )}
        </div>
      </div>
      <div className="topbar__right">
        <div className="status-dot">
          <div className="status-dot__circle" />
          <span>API Conectada</span>
        </div>
        <button
          onClick={logout}
          title="Sair da conta"
          aria-label="Sair da conta"
          className="btn btn--red"
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
}
