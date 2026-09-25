import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/apiService';

export default function AutocompleteTicker({ value, onChange, onSelectDetails, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const data = await apiFetch(`/api/investimentos/busca?q=${encodeURIComponent(query)}`);
        setSuggestions(data || []);
      } catch (err) {
        console.error('Erro na busca de tickers:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (item) => {
    const { ticker, preco, setor } = item;
    setQuery(ticker);
    onChange(ticker);
    setShowDropdown(false);

    // Immediate auto-fill with price and sector
    onSelectDetails({ preco, setor, loadingDividends: true });

    // Fetch dividends in background
    try {
      const details = await apiFetch(`/api/investimentos/busca?ticker=${encodeURIComponent(ticker)}`);
      onSelectDetails({ preco, setor, dividendoAnual: details?.dividendoAnual || 0, loadingDividends: false });
    } catch (err) {
      console.error('Erro ao buscar dividendos:', err);
      onSelectDetails({ preco, setor, dividendoAnual: 0, loadingDividends: false });
    }
  };

  const renderDropdownContent = () => {
    if (query.length < 2) {
      return (
        <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Digite o código ou nome do ativo para buscar na B3...
        </li>
      );
    }
    if (suggestions.length === 0 && !loading) {
      return (
        <li style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Nenhum resultado encontrado.
        </li>
      );
    }
    return suggestions.map((s, i) => (
      <li
        key={i}
        onClick={() => handleSelect(s)}
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(45,212,191,0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13 }}>{s.ticker}</strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.nome}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong style={{ display: 'block', color: 'var(--teal)', fontSize: 13 }}>
            R$ {s.preco != null ? s.preco.toFixed(2) : '---'}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.setor}</span>
        </div>
      </li>
    ));
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: 12, opacity: 0.5, pointerEvents: 'none' }}>🔍</span>
        <input
          className="modal__input"
          style={{ paddingLeft: 36 }}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--teal)' }}>
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          </div>
        )}
      </div>

      {showDropdown && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#1e293b',
          border: '1.5px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          marginTop: 4,
          padding: 0,
          listStyle: 'none',
          maxHeight: 220,
          overflowY: 'auto',
          zIndex: 9999,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
        }}>
          {renderDropdownContent()}
        </ul>
      )}
    </div>
  );
}
