import { useState } from "react";
import { useConfig } from "../hooks/useConfig";
import { useToast } from "../components/Toast";

export default function Configuracoes() {
  const { config, loading, error, atualizarChave } = useConfig();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-16">
        <div className="loading-state" style={{ marginTop: 40 }}>
          <div className="loading-spinner" />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state" style={{ marginTop: 40 }}>
        <div className="error-state__icon">⚠️</div>
        <p className="error-state__title">Erro ao carregar configurações</p>
        <p className="error-state__msg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
        Configurações do Sistema
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
        Gerencie as categorias e opções padrão que aparecerão nos formulários do sistema.
      </p>

      <div className="grid-kpi" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <ConfigSection
          title="Receitas"
          chave="categorias_receitas"
          config={config}
          atualizarChave={atualizarChave}
          toast={toast}
          placeholder="Ex: Freelance"
          color="teal"
        />
        <ConfigSection
          title="Gastos Fixos"
          chave="categorias_gastos_fixos"
          config={config}
          atualizarChave={atualizarChave}
          toast={toast}
          placeholder="Ex: Saúde"
          color="blue"
        />
        <ConfigSection
          title="Gastos Variáveis"
          chave="categorias_gastos_variaveis"
          config={config}
          atualizarChave={atualizarChave}
          toast={toast}
          placeholder="Ex: Lazer"
          color="purple"
        />
        <ConfigSection
          title="Formas de Pagamento"
          chave="formas_pagamento"
          config={config}
          atualizarChave={atualizarChave}
          toast={toast}
          placeholder="Ex: Vale Refeição"
          color="green"
        />
      </div>
    </div>
  );
}

function ConfigSection({ title, chave, config, atualizarChave, toast, placeholder, color }) {
  const [novoItem, setNovoItem] = useState("");
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [valorEdicao, setValorEdicao] = useState("");
  const items = config?.[chave] || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    const val = novoItem.trim();
    if (!val) return;
    
    if (items.includes(val)) {
      toast.error(`"${val}" já existe na lista.`);
      return;
    }

    const novas = [...items, val];
    try {
      await atualizarChave(chave, novas);
      toast.success(`"${val}" adicionado com sucesso!`);
      setNovoItem("");
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const handleRemove = async (itemToRemove) => {
    if (!window.confirm(`Tem certeza que deseja remover "${itemToRemove}"? Isso não alterará registros antigos no banco de dados, apenas removerá da lista de seleção.`)) {
      return;
    }
    
    const novas = items.filter(i => i !== itemToRemove);
    try {
      await atualizarChave(chave, novas);
      toast.success(`"${itemToRemove}" removido com sucesso.`);
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    }
  };

  const iniciarEdicao = (item) => {
    setItemEmEdicao(item);
    setValorEdicao(item);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const valor = valorEdicao.trim();
    if (!valor || valor === itemEmEdicao) {
      setItemEmEdicao(null);
      return;
    }
    if (items.includes(valor)) {
      toast.error(`"${valor}" já existe na lista.`);
      return;
    }

    try {
      await atualizarChave(chave, items.map(item => item === itemEmEdicao ? valor : item));
      toast.success(`"${itemEmEdicao}" alterado para "${valor}".`);
      setItemEmEdicao(null);
      setValorEdicao("");
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <div className="card">
      <div className="sec-header">
        <span className="sec-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${color})` }} />
          {title}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 200, overflowY: "auto", paddingRight: 8 }}>
        {items.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic" }}>Nenhum item cadastrado.</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} style={{ 
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              {itemEmEdicao === item ? (
                <form onSubmit={handleEdit} style={{ display: "flex", gap: 6, flex: 1 }}>
                  <input
                    autoFocus
                    type="text"
                    className="form-input"
                    value={valorEdicao}
                    onChange={e => setValorEdicao(e.target.value)}
                    style={{ flex: 1, padding: "5px 8px", fontSize: 13 }}
                  />
                  <button type="submit" className={`btn btn--${color}`} style={{ padding: "5px 8px" }} title="Salvar alteração">✓</button>
                  <button type="button" onClick={() => setItemEmEdicao(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }} title="Cancelar">✕</button>
                </form>
              ) : (
                <>
                  <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{item}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => iniciarEdicao(item)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", opacity: 0.7 }}
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleRemove(item)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", opacity: 0.7 }}
                      title="Remover"
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.opacity = 0.7; }}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={novoItem}
          onChange={e => setNovoItem(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
        />
        <button 
          type="submit" 
          className={`btn btn--${color}`} 
          style={{ padding: "8px 16px", borderRadius: 8 }}
          disabled={!novoItem.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
}
