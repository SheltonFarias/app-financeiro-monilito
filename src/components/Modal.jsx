/**
 * Modal — Modal de adição/edição com formulário dinâmico por tipo.
 * Salva diretamente no backend REST local via apiService.
 * Usa o sistema de toast global para feedback de sucesso/erro.
 */
import { useState, useMemo } from "react";
import { addRow, editRow } from "../utils/apiService";
import { useToast } from "./Toast";
import { useConfig } from "../hooks/useConfig";
import AutocompleteTicker from "./AutocompleteTicker";

function getFieldDefs(config) {
  const cReceitas = config?.categorias_receitas || ["Trabalho","Apartamento","Outros","Mãe"];
  const cGastosFixos = config?.categorias_gastos_fixos || ["Educação","Veiculo","Casa","Apartamento","Lazer","Outros","Saúde","Mãe"];
  const cGastosVar = config?.categorias_gastos_variaveis || ["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"];
  const pagamentos = config?.formas_pagamento || ["Cartão Inter","Cartão Nubank","Débito","Pix"];

  return {
    "Gasto Fixo": [
      { key: "categoria",  label: "Categoria",         type: "select", options: cGastosFixos },
      { key: "descricao",  label: "Descrição",          type: "text",   placeholder: "Ex: Internet, Financiamento..." },
      { key: "valor",      label: "Valor (R$)",          type: "number", placeholder: "0.00" },
      { key: "vencimento", label: "Dia do Vencimento",   type: "number", placeholder: "Ex: 10 (dia do mês)" },
      { key: "cartao",     label: "Forma de Pagamento",  type: "select", options: ["—", "Cartão Inter", "Cartão Nubank"] },
      { key: "situacao",   label: "Situação",            type: "select", options: ["Pendente","Pago"] },
    ],
    "Gasto Variável": [
      { key: "categoria",   label: "Categoria",         type: "select",  options: cGastosVar },
      { key: "descricao",   label: "Descrição",         type: "text",    placeholder: "Ex: Supermercado, iFood..." },
      { key: "valor",       label: "Valor (R$)",         type: "number",  placeholder: "0.00" },
      { key: "pagamento",   label: "Forma de Pagamento", type: "select",  options: pagamentos },
      { key: "qtd_parcelas",label: "Parcelas (Qtd)",     type: "number",  placeholder: "1" },
      { key: "situacao",    label: "Situação",           type: "select",  options: ["Pendente","Pago"] },
    ],
    "Receita": [
      { key: "categoria",  label: "Categoria",   type: "select", options: cReceitas },
      { key: "descricao",  label: "Descrição",   type: "text",   placeholder: "Ex: Salário, Aluguel..." },
      { key: "valor",      label: "Valor (R$)",   type: "number", placeholder: "0.00" },
      { key: "situacao",   label: "Situação",     type: "select", options: ["Pendente","Recebido"] },
    ],
    "Investimento": [
      { key: "tipo",            label: "Tipo",                    type: "select", options: ["FII","Ação","ETF","Renda Fixa"] },
      { key: "ticker",          label: "Ticker / Nome",          type: "autocomplete_ticker",   placeholder: "Ex: MXRF11, PETR4..." },
      { key: "quantidade",      label: "Quantidade",              type: "number", placeholder: "0" },
      { key: "precoMedio",      label: "Preço Médio (R$)",        type: "number", placeholder: "0.00" },
      { key: "setor",           label: "Setor",                   type: "text",   placeholder: "Ex: Papel, Logística..." },
      { key: "dataCompra",      label: "Data da Compra",          type: "date" },
      { key: "rentabilidadeCdi", label: "Rentabilidade (% do CDI)", type: "number", placeholder: "Ex: 110 (para 110% do CDI)", condicional: "Renda Fixa" },
      { key: "dividendoAnual",  label: "Dividendo Anual (R$/cota)", type: "number", placeholder: "Ex: 12.00", condicionalNot: "Renda Fixa", dica: "💡 Dividendo anual estimado por cota/ação. Usado para calcular o DY% na análise." },
    ],
    "Orçamento": [
      { key: "categoria",    label: "Categoria",         type: "select", options: cGastosVar },
      { key: "valor_limite", label: "Valor Limite (R$)", type: "number", placeholder: "0.00" },
    ],
    "Meta": [
      { key: "titulo",     label: "Título",            type: "text",   placeholder: "Ex: Viagem Europa" },
      { key: "descricao",  label: "Descrição",         type: "text",   placeholder: "Opcional" },
      { key: "valor_alvo", label: "Valor Alvo (R$)",   type: "number", placeholder: "0.00" },
      { key: "valor_atual",label: "Valor Atual (R$)",  type: "number", placeholder: "0.00" },
      { key: "data_limite",label: "Data Limite",       type: "date" },
    ],
    "Cartão de Crédito": [
      { key: "nome",           label: "Nome do Cartão", type: "text",   placeholder: "Ex: Nubank Ultravioleta" },
      { key: "limite_total",   label: "Limite Total",   type: "number", placeholder: "0.00" },
      { key: "dia_fechamento", label: "Dia Fechamento", type: "number", placeholder: "Ex: 25" },
      { key: "dia_vencimento", label: "Dia Vencimento", type: "number", placeholder: "Ex: 5" },
    ],
  };
}

const ABA_MAP = {
  "Gasto Fixo":     "gastos_fixos",
  "Gasto Variável": "gastos_variaveis",
  "Receita":        "receitas",
  "Investimento":   "investimentos",
  "Orçamento":      "orcamentos",
  "Meta":           "metas",
  "Cartão de Crédito": "cartoes",
};

/** Detecta o tipo de recorrência a partir dos dados de um registro existente */
function detectarTipoRecorrencia(data) {
  if (!data) return "avulso";
  if (data.mensal === 1) return "mensal";
  if (data.data_fim) return "ate_data";
  return "avulso";
}

export default function Modal({ tipo, initialData, mesAtual, onClose, onSave }) {
  // Para data_fim exibida no formato DD/MM/AAAA, converte ISO → BR ao abrir
  const toDisplayDate = (iso) => {
    if (!iso) return "";
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso;
  };

  const prepareInitial = (data) => {
    if (!data) return {};
    const copy = { ...data };
    if (copy.data_fim) copy.data_fim = toDisplayDate(copy.data_fim);
    return copy;
  };

  const [form,   setForm]   = useState(prepareInitial(initialData));
  const [saving, setSaving] = useState(false);

  // Tipo de cobrança para Gasto Fixo e Receita
  const [tipoCobranca, setTipoCobranca] = useState(
    (tipo === "Gasto Fixo" || tipo === "Receita") ? detectarTipoRecorrencia(initialData) : "avulso"
  );

  const { toast } = useToast();
  const { config } = useConfig();

  const fieldDefs = useMemo(() => getFieldDefs(config), [config]);

  const fields = fieldDefs[tipo] || [];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);

    // Processa os campos numéricos
    const processed = { ...form };
    if (processed.valor)        processed.valor        = parseFloat(processed.valor)        || 0;
    if (processed.valor_limite) processed.valor_limite = parseFloat(processed.valor_limite) || 0;
    if (processed.quantidade)   processed.quantidade   = parseInt(processed.quantidade)     || 0;
    if (processed.precoMedio)      processed.precoMedio      = parseFloat(processed.precoMedio)      || 0;
    if (processed.qtd_parcelas)    processed.qtd_parcelas    = parseInt(processed.qtd_parcelas)       || 1;
    if (processed.rentabilidadeCdi !== undefined && processed.rentabilidadeCdi !== null && processed.rentabilidadeCdi !== '')
      processed.rentabilidadeCdi = parseFloat(processed.rentabilidadeCdi) || null;
    if (processed.dividendoAnual !== undefined && processed.dividendoAnual !== null && processed.dividendoAnual !== '')
      processed.dividendoAnual = parseFloat(processed.dividendoAnual) || null;
    else if (processed.dividendoAnual === '')
      processed.dividendoAnual = null;

    // Meta / Cartao Numeric Fields
    if (processed.valor_alvo  !== undefined) processed.valor_alvo  = parseFloat(processed.valor_alvo)  || 0;
    if (processed.valor_atual !== undefined) processed.valor_atual = parseFloat(processed.valor_atual) || 0;
    else processed.valor_atual = 0; // garante que sempre vai com valor
    if (processed.limite_total)   processed.limite_total   = parseFloat(processed.limite_total)   || 0;
    if (processed.dia_fechamento) processed.dia_fechamento = parseInt(processed.dia_fechamento)   || 1;
    if (processed.dia_vencimento) processed.dia_vencimento = parseInt(processed.dia_vencimento)  || 1;

    if (processed.recorrente) processed.recorrente = (processed.recorrente === "Sim" || processed.recorrente === 1) ? 1 : 0;

    // Lógica de recorrência para Gasto Fixo e Receita
    if (tipo === "Gasto Fixo" || tipo === "Receita") {
      // Converte data_fim de DD/MM/AAAA → AAAA-MM-DD para o backend
      if (tipoCobranca === "ate_data" && processed.data_fim) {
        const m = processed.data_fim.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) processed.data_fim = `${m[3]}-${m[2]}-${m[1]}`;
      }

      if (tipoCobranca === "mensal") {
        processed.mensal      = 1;
        processed.recorrente  = 1; // compatibilidade legado (receitas)
        processed.data_fim    = null;
        processed.data_inicio = processed.data_inicio || null;
      } else if (tipoCobranca === "ate_data") {
        processed.mensal      = 0;
        processed.recorrente  = 0;
        processed.data_inicio = processed.data_inicio || null;
        processed.data_fim    = processed.data_fim    || null;
      } else {
        // avulso
        processed.mensal      = 0;
        processed.recorrente  = 0;
        processed.data_inicio = null;
        processed.data_fim    = null;
      }
    }

    // Adiciona o mês atual automaticamente (exceto se não precisar)
    if (tipo !== "Investimento" && tipo !== "Cartão de Crédito" && tipo !== "Meta" && mesAtual) {
      processed.mes = mesAtual;
    }


    try {
      if (initialData) {
        await editRow(ABA_MAP[tipo], { id: initialData.id }, processed);
        toast.success(`${tipo} editado com sucesso!`);
      } else {
        await addRow(ABA_MAP[tipo], processed);
        toast.success(`${tipo} salvo com sucesso!`);
      }
      onSave(processed);
      onClose();
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal__title">{initialData ? "✎ Editar" : "+ Adicionar"} {tipo}</h3>

        {fields.map(field => {
          // condicional: só mostra quando form.tipo === valor (ex: Renda Fixa)
          const isCondicional    = !!field.condicional;
          const condVisible      = !isCondicional || form.tipo === field.condicional;

          // condicionalNot: só mostra quando form.tipo ≠ valor (ex: não Renda Fixa)
          const isCondicionalNot = !!field.condicionalNot;
          const condNotVisible   = !isCondicionalNot || form.tipo !== field.condicionalNot;

          // Campo só aparece se ambas as condições forem verdadeiras
          const visible = condVisible && condNotVisible;
          const hasAnimation = isCondicional || isCondicionalNot;

          return (
            <div
              key={field.key}
              className="modal__field"
              style={hasAnimation ? {
                maxHeight:    visible ? '140px' : '0',
                opacity:      visible ? 1 : 0,
                overflow:     'hidden',
                marginBottom: visible ? undefined : 0,
                paddingBottom:visible ? undefined : 0,
                transition:   'max-height 0.3s ease, opacity 0.25s ease',
                pointerEvents: visible ? 'auto' : 'none',
              } : undefined}
            >
              {visible && (
                <>
                  <label className="modal__label">{field.label}</label>
                  {/* Dica genérica do campo */}
                  {field.dica && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                      {field.dica}
                    </div>
                  )}
                  {/* Dica específica do CDI */}
                  {isCondicional && !field.dica && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                      💡 Taxa contratada em % do CDI — ex: <strong>110</strong> para 110% do CDI
                    </div>
                  )}
                  {field.type === "select" ? (
                    <select
                      className="modal__select"
                      value={form[field.key] || ""}
                      onChange={e => set(field.key, e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "autocomplete_ticker" && form.tipo !== "Renda Fixa" ? (
                    <AutocompleteTicker
                      value={form[field.key] || ""}
                      onChange={val => set(field.key, val)}
                      placeholder={field.placeholder}
                      onSelectDetails={(details) => {
                        setForm(prev => {
                          const updates = { ...prev };
                          if (details.preco) updates.precoMedio = details.preco;
                          if (details.setor) updates.setor = details.setor;
                          if (details.dividendoAnual !== undefined) updates.dividendoAnual = details.dividendoAnual;
                          
                          if (!prev.dataCompra) {
                            const today = new Date().toISOString().split('T')[0];
                            updates.dataCompra = today;
                          }
                          return updates;
                        });
                      }}
                    />
                  ) : (
                    <input
                      className="modal__input"
                      type={field.type === "number" ? "text" : field.type === "autocomplete_ticker" ? "text" : field.type}
                      inputMode={field.type === "number" ? "decimal" : undefined}
                      value={form[field.key] || ""}
                      onChange={e => set(field.key, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* ── Seção de Recorrência (Gasto Fixo e Receita) ── */}
        {(tipo === "Gasto Fixo" || tipo === "Receita") && (
          <BlocoRecorrencia
            tipoCobranca={tipoCobranca}
            setTipoCobranca={setTipoCobranca}
            dataFim={form.data_fim || ""}
            onChangeDataFim={v => set("data_fim", v)}
            mesAtual={mesAtual}
            labelTipo={tipo === "Receita" ? "receita" : "gasto"}
          />
        )}

        {/* Mês vinculado automaticamente */}
        {tipo !== "Investimento" && mesAtual && tipo !== "Gasto Fixo" && tipo !== "Receita" && (
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.5)",
            background: "rgba(255,255,255,0.03)",
            border: "1.5px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "9px 13px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📅 Será salvo no mês: <strong style={{ color: "var(--teal)" }}>
              {mesAtual.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}
            </strong>
          </div>
        )}

        <div className="modal__actions">
          <button className="btn btn--ghost btn--lg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn--teal btn--lg" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Bloco de recorrência reutilizável — exibido para Gasto Fixo e Receita.
 */
function BlocoRecorrencia({ tipoCobranca, setTipoCobranca, dataFim, onChangeDataFim, mesAtual, labelTipo }) {
  return (
    <div style={{
      marginBottom: 18,
      padding: "16px",
      background: "rgba(255,255,255,0.03)",
      border: "1.5px solid rgba(255,255,255,0.09)",
      borderRadius: 12,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        🔁 Tipo de Recorrência
      </div>

      {/* Botões de seleção */}
      <div style={{ display: "flex", gap: 8, marginBottom: tipoCobranca !== "avulso" ? 14 : 0 }}>
        {[
          { key: "avulso",   label: "📌 Avulso",       desc: "Só neste mês" },
          { key: "mensal",   label: "♾️ Mensal",        desc: "Todos os meses" },
          { key: "ate_data", label: "📅 Até uma data",  desc: "Escolher mês fim" },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTipoCobranca(opt.key)}
            title={opt.desc}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: 10,
              border: tipoCobranca === opt.key
                ? "2px solid var(--teal)"
                : "1.5px solid rgba(255,255,255,0.1)",
              background: tipoCobranca === opt.key
                ? "rgba(45,212,191,0.12)"
                : "rgba(255,255,255,0.04)",
              color: tipoCobranca === opt.key ? "var(--teal)" : "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontWeight: tipoCobranca === opt.key ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            <div>{opt.label}</div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Campo data_fim só aparece quando "ate_data" */}
      {tipoCobranca === "ate_data" && (
        <div>
          <label className="modal__label" style={{ marginBottom: 6 }}>Último mês (data fim)</label>
          <input
            className="modal__input"
            type="text"
            inputMode="numeric"
            value={dataFim}
            onChange={e => onChangeDataFim(e.target.value)}
            placeholder="DD/MM/AAAA"
            style={{ marginBottom: 6 }}
          />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
            Ex: para encerrar em Dez/2026, informe <strong>31/12/2026</strong>
          </div>
        </div>
      )}

      {/* Info de contexto */}
      {tipoCobranca === "mensal" && (
        <div style={{ fontSize: 12, color: "var(--teal)", display: "flex", alignItems: "center", gap: 6, background: "rgba(45,212,191,0.07)", borderRadius: 8, padding: "8px 10px" }}>
          <span>♾️</span>
          <span>Esta {labelTipo} aparecerá automaticamente em <strong>todos os meses</strong>, sem data de encerramento.</span>
        </div>
      )}
      {tipoCobranca === "avulso" && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 6 }}>
          <span>📌</span>
          <span>Registrado apenas no mês <strong style={{ color: "var(--teal)" }}>{mesAtual?.replace(/([A-Za-zÀ-ú]+)(\d+)/, "$1 $2")}</strong>.</span>
        </div>
      )}
    </div>
  );
}
