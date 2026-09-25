"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const brl = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(valor || 0);

export default function FinanciamentoDashboard({ contrato, tabela }) {
  if (!contrato || !tabela.length) return null;
  const atual = tabela.find((linha) => linha.parcela === contrato.parcela_atual) || tabela[0];
  const ultima = tabela.at(-1);
  const jurosTotais = tabela.reduce((total, linha) => total + linha.juros, 0);
  const correcoes = tabela.reduce((total, linha) => total + linha.correcao_indice, 0);
  const passo = Math.max(1, Math.ceil(tabela.length / 36));
  const dadosGrafico = tabela.filter((linha, indice) => indice % passo === 0 || linha === ultima).map((linha) => ({ parcela: linha.parcela, saldo: Math.round(linha.saldo_devedor) }));

  return <section className="card" style={{ marginBottom: 20 }}>
    <h2>Resumo do contrato</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
      <div><small>Saldo projetado</small><strong style={{ display: "block", fontSize: 18 }}>{brl(atual.saldo_antes_aporte)}</strong></div>
      <div><small>Juros projetados</small><strong style={{ display: "block", fontSize: 18 }}>{brl(jurosTotais)}</strong></div>
      <div><small>Correções pelo índice</small><strong style={{ display: "block", fontSize: 18 }}>{brl(correcoes)}</strong></div>
      <div><small>Quitação projetada</small><strong style={{ display: "block", fontSize: 18 }}>{new Date(ultima.data_vencimento).toLocaleDateString("pt-BR")}</strong></div>
    </div>
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer><LineChart data={dadosGrafico} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="parcela" tickFormatter={(valor) => `#${valor}`} /><YAxis tickFormatter={brl} width={70} /><Tooltip formatter={(valor) => brl(valor)} labelFormatter={(valor) => `Parcela ${valor}`} /><Line type="monotone" dataKey="saldo" name="Saldo devedor" stroke="#16a394" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
    </div>
  </section>;
}
