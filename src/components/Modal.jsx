/**
 * Modal — Modal de adição/edição com formulário dinâmico por tipo.
 * Salva diretamente no backend REST local via apiService.
 * Usa o sistema de toast global para feedback de sucesso/erro.
 */
import { useState } from "react";
import { addRow, editRow } from "../utils/apiService";
import { useToast } from "./Toast";

const FIELD_DEFS = {
  "Gasto Fixo": [
    { key: "categoria",  label: "Categoria",       type: "select",  options: ["Educação","Veiculo","Casa","Apartamento","Lazer","Outros","Saúde","Mãe"] },
    { key: "descricao",  label: "Descrição",        type: "text",    placeholder: "Ex: Internet, Financiamento..." },
    { key: "valor",      label: "Valor (R$)",        type: "number",  placeholder: "0.00" },
    { key: "vencimento", label: "Vencimento",        type: "text",    placeholder: "Mensal ou data (2026-06-15)" },
    { key: "cartao",     label: "Cartão / Pessoa",   type: "select",  options: ["—","Cartão Inter","Cartão Nubank"] },
    { key: "situacao",   label: "Situação",          type: "select",  options: ["Pendente","Pago"] },
  ],
  "Gasto Variável": [
    { key: "categoria",  label: "Categoria",         type: "select",  options: ["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"] },
    { key: "descricao",  label: "Descrição",         type: "text",    placeholder: "Ex: Supermercado, iFood..." },
    { key: "valor",      label: "Valor (R$)",         type: "number",  placeholder: "0.00" },
    { key: "parcela",    label: "Última Parcela",     type: "text",    placeholder: "Data ou vazio" },
    { key: "pagamento",  label: "Forma de Pagamento", type: "select",  options: ["Cartão Inter","Cartão Nubank","Débito","Pix"] },
    { key: "qtd_parcelas",label:"Parcelas (Qtd)",     type: "number",  placeholder: "1" },
    { key: "subcategoria",label: "Subcategoria",      type: "text",    placeholder: "Ex: Assinaturas" },
    { key: "tags",       label: "Tags",               type: "text",    placeholder: "ex: #viagem, #trabalho" },
    { key: "recorrente", label: "Recorrente?",        type: "select",  options: ["Não", "Sim"] },
    { key: "situacao",   label: "Situação",           type: "select",  options: ["Pendente","Pago"] },
  ],
  "Receita": [
    { key: "categoria",  label: "Categoria",  type: "select", options: ["Trabalho","Apartamento","Outros","Mãe"] },
    { key: "descricao",  label: "Descrição",  type: "text",   placeholder: "Ex: Salário, Aluguel..." },
    { key: "valor",      label: "Valor (R$)", type: "number", placeholder: "0.00" },
    { key: "situacao",   label: "Situação",   type: "select", options: ["Pendente","Recebido"] },
    { key: "cartao",     label: "Pessoa",     type: "select", options: ["—"] },
  ],
  "Investimento": [
    { key: "ticker",     label: "Ticker / Nome",    type: "text",   placeholder: "Ex: MXRF11, PETR4..." },
    { key: "tipo",       label: "Tipo",              type: "select", options: ["FII","Ação","ETF","Renda Fixa"] },
    { key: "quantidade", label: "Quantidade",        type: "number", placeholder: "0" },
    { key: "precoMedio", label: "Preço Médio (R$)",  type: "number", placeholder: "0.00" },
    { key: "setor",      label: "Setor",             type: "text",   placeholder: "Ex: Papel, Logística..." },
    { key: "dataCompra", label: "Data da Compra",    type: "date" },
  ],
  "Orçamento": [
    { key: "categoria",  label: "Categoria", type: "select", options: ["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"] },
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

const ABA_MAP = {
  "Gasto Fixo":     "gastos_fixos",
  "Gasto Variável": "gastos_variaveis",
  "Receita":        "receitas",
  "Investimento":   "investimentos",
  "Orçamento":      "orcamentos",
  "Meta":           "metas",
  "Cartão de Crédito": "cartoes",
};

export default function Modal({ tipo, initialData, mesAtual, onClose, onSave }) {
  const [form,   setForm]   = useState(initialData || {});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fields = FIELD_DEFS[tipo] || [];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);

    // Processa os campos numéricos
    const processed = { ...form };
    if (processed.valor)      processed.valor      = parseFloat(processed.valor)      || 0;
    if (processed.valor_limite) processed.valor_limite = parseFloat(processed.valor_limite) || 0;
    if (processed.quantidade) processed.quantidade = parseInt(processed.quantidade)   || 0;
    if (processed.precoMedio) processed.precoMedio = parseFloat(processed.precoMedio) || 0;
    if (processed.qtd_parcelas) processed.qtd_parcelas = parseInt(processed.qtd_parcelas) || 1;
    
    // Meta / Cartao Numeric Fields
    if (processed.valor_alvo) processed.valor_alvo = parseFloat(processed.valor_alvo) || 0;
    if (processed.valor_atual) processed.valor_atual = parseFloat(processed.valor_atual) || 0;
    if (processed.limite_total) processed.limite_total = parseFloat(processed.limite_total) || 0;
    if (processed.dia_fechamento) processed.dia_fechamento = parseInt(processed.dia_fechamento) || 1;
    if (processed.dia_vencimento) processed.dia_vencimento = parseInt(processed.dia_vencimento) || 1;
    
    if (processed.recorrente) processed.recorrente = (processed.recorrente === "Sim" || processed.recorrente === 1) ? 1 : 0;

    // Adiciona o mês atual automaticamente (exceto se não precisar)
    if (tipo !== "Investimento" && tipo !== "Cartão de Crédito" && tipo !== "Meta" && mesAtual) {
      processed.mes = mesAtual;
    }

    try {
      if (initialData) {
        // Edição: usa o ID do registro original como chave
        await editRow(ABA_MAP[tipo], { id: initialData.id }, processed);
        toast.success(`${tipo} editado com sucesso!`);
      } else {
        // Criação: adiciona novo registro
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

        {fields.map(field => (
          <div className="modal__field" key={field.key}>
            <label className="modal__label">{field.label}</label>
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
            ) : (
              <input
                className="modal__input"
                type={field.type === "number" ? "text" : field.type}
                inputMode={field.type === "number" ? "decimal" : undefined}
                value={form[field.key] || ""}
                onChange={e => set(field.key, e.target.value)}
                placeholder={field.placeholder || ""}
              />
            )}
          </div>
        ))}

        {/* Mês vinculado automaticamente */}
        {tipo !== "Investimento" && mesAtual && (
          <div style={{
            fontSize: 11, color: "var(--text-muted)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 6, padding: "6px 10px", marginBottom: 12,
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
