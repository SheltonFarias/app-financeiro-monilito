"use client";
import { useState } from "react";
import VisaoGeral from "../pages_components/VisaoGeral";
import GastosFixos from "../pages_components/GastosFixos";
import GastosVariaveis from "../pages_components/GastosVariaveis";
import Investimentos from "../pages_components/Investimentos";
import Receitas from "../pages_components/Receitas";
import Cartoes from "../pages_components/Cartoes";
import Metas from "../pages_components/Metas";
import Relatorios from "../pages_components/Relatorios";
import Modal from "../components/Modal";
import Login from "../components/Login";
import { ToastProvider } from "../components/Toast";
import { useSheetData } from "../hooks/useSheetData";
import { getMesAtual } from "../utils/format";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { icon: "📊", label: "Visão Geral",      key: 0 },
  { icon: "📌", label: "Gastos Fixos",     key: 1 },
  { icon: "🛒", label: "Gastos Variáveis", key: 2 },
  { icon: "💰", label: "Receitas",         key: 3 },
  { icon: "💳", label: "Cartões",          key: 4 },
  { icon: "🎯", label: "Metas",            key: 5 },
  { icon: "📈", label: "Relatórios",       key: 6 },
  { icon: "💼", label: "Investimentos",    key: 7 },
];

/** Gera lista de meses para o ano atual (completo) + próximo ano, no formato "MêsANO" */
const NOMES_MESES = [
  "Janeiro","Fevereiro","Marco","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
function gerarMeses() {
  const anoAtual  = new Date().getFullYear();
  const anos = [anoAtual, anoAtual + 1];
  // Inclui todos os 12 meses de cada ano (incluindo os passados do ano atual)
  return anos.flatMap(ano => NOMES_MESES.map(m => m + ano));
}

export default function App() {
  const { isAuthenticated, login, logout } = useAuth();

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
  const [mesAtual,     setMesAtual]     = useState(getMesAtual());
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const { data, loading, error, refetch } = useSheetData(mesAtual);

  const mesLabel = mesAtual.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2");

  const closeSidebar = () => setSidebarOpen(false);

  if (loading) return (
    <div className="shell">
      <Sidebar tab={tab} setTab={setTab}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
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
    <div className="shell">
      <Sidebar tab={tab} setTab={setTab}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
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
    <Cartoes key="cc" data={data.cartoes} onAdd={() => setModal({ tipo: "Cartão de Crédito" })} onEdit={(item) => setModal({ tipo: "Cartão de Crédito", item })} refetch={refetch} />,
    <Metas key="mt" data={data.metas} onAdd={() => setModal({ tipo: "Meta" })} onEdit={(item) => setModal({ tipo: "Meta", item })} refetch={refetch} />,
    <Relatorios key="rel" mesAtual={mesAtual} />,
    <Investimentos key="inv" data={data.investimentos} onAdd={() => setModal({ tipo: "Investimento" })} onEdit={(item) => setModal({ tipo: "Investimento", item })} refetch={refetch} />,
  ];


  return (
    <div className="shell">
      <Sidebar tab={tab} setTab={(t) => { setTab(t); closeSidebar(); }}
        mesAtual={mesAtual} setMesAtual={setMesAtual}
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
function Sidebar({ tab, setTab, mesAtual, setMesAtual, isOpen, onClose }) {
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
          >
            <span className="nav-item__icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Month selector in footer */}
      <div className="sidebar__section-label">Período</div>
      <div style={{ padding: "4px 10px 8px" }}>
        <select
          value={mesAtual}
          onChange={(e) => setMesAtual(e.target.value)}
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px",
            padding: "8px 10px", color: "var(--text-primary)",
            fontFamily: "var(--font)", fontSize: "12px", fontWeight: 600,
            cursor: "pointer", outline: "none",
          }}
        >
          {gerarMeses().map(m => (
            <option key={m} value={m} style={{ background: "#1a2332" }}>
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
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>
            — {mesLabel}
          </span>
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
          style={{
            background: "rgba(244,100,95,0.12)",
            border: "1px solid rgba(244,100,95,0.25)",
            borderRadius: 8, padding: "5px 12px",
            color: "#f4645f", fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,100,95,0.22)"; e.currentTarget.style.borderColor = "rgba(244,100,95,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(244,100,95,0.12)"; e.currentTarget.style.borderColor = "rgba(244,100,95,0.25)"; }}
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
}
