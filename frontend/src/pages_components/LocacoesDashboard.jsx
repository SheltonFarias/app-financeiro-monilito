"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { buildLocacoesDashboard } from "./locacoesDashboardData";

const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
const mes = (value) => new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${value}-02T12:00:00`));

export default function LocacoesDashboard({ imoveis, contratos, competencia, onSelectContrato }) {
  const dashboard = buildLocacoesDashboard(imoveis, contratos, competencia);
  const ocupacao = dashboard.totalImoveis ? Math.round((dashboard.ocupados / dashboard.totalImoveis) * 100) : 0;

  return <>
    <section id="alugueis-visao" className="locacoes-hero">
      <div>
        <p className="locacoes-hero__eyebrow">Carteira de locação</p>
        <h1>Patrimônio, recebimentos e prazos em uma visão.</h1>
        <p>Use os atalhos do menu para operar imóveis, contratos e cobranças sem perder o panorama da carteira.</p>
      </div>
      <div className="locacoes-hero__occupancy"><span>Ocupação</span><strong>{ocupacao}%</strong><small>{dashboard.ocupados} de {dashboard.totalImoveis} imóveis</small></div>
    </section>

    <section className="locacoes-kpis" aria-label="Indicadores da carteira">
      <div className="locacoes-kpi"><span>Receita prevista</span><strong>{brl(dashboard.previsto)}</strong><small>na competência selecionada</small></div>
      <div className="locacoes-kpi locacoes-kpi--positive"><span>Recebido</span><strong>{brl(dashboard.recebido)}</strong><small>{dashboard.contratosAtivos} contratos ativos</small></div>
      <div className={`locacoes-kpi${dashboard.pendente ? " locacoes-kpi--attention" : ""}`}><span>Em aberto</span><strong>{brl(dashboard.pendente)}</strong><small>{dashboard.cobrancasEmAberto.length} cobrança(s) para acompanhar</small></div>
      <div className="locacoes-kpi"><span>Disponíveis</span><strong>{dashboard.disponiveis}</strong><small>imóveis sem contrato ativo</small></div>
    </section>

    <section className="card locacoes-chart-card">
      <div className="finance-card__header"><div><h2>Fluxo de recebimentos</h2><p>Projeção contratada para seis meses e baixas efetivamente registradas.</p></div></div>
      <div className="locacoes-chart"><ResponsiveContainer width="100%" height={280}><AreaChart data={dashboard.fluxo} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="locacoesPrevisto" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#47a9ff" stopOpacity={0.42} /><stop offset="100%" stopColor="#47a9ff" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(174,214,255,.12)" /><XAxis dataKey="competencia" tickFormatter={mes} axisLine={false} tickLine={false} stroke="#8ea4c4" /><YAxis tickFormatter={(value) => `R$${value / 1000}k`} axisLine={false} tickLine={false} stroke="#8ea4c4" /><Tooltip formatter={(value) => brl(value)} labelFormatter={(value) => `Competência ${value}`} contentStyle={{ background: "#11203b", border: "1px solid rgba(174,214,255,.24)", borderRadius: 10 }} /><Legend /><Area type="monotone" dataKey="previsto" name="Previsto" stroke="#47a9ff" fill="url(#locacoesPrevisto)" strokeWidth={2} /><Area type="monotone" dataKey="recebido" name="Recebido" stroke="#42d5ad" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
    </section>

    <section className="locacoes-attention-grid">
      <div className="card locacoes-attention-card"><div className="finance-card__header"><div><h2>Cobranças que pedem atenção</h2><p>Competência {competencia}</p></div></div>{dashboard.cobrancasEmAberto.length ? <div className="locacoes-attention-list">{dashboard.cobrancasEmAberto.map((cobranca) => <button key={cobranca.id} onClick={() => onSelectContrato(cobranca.contrato.id)}><span><strong>{cobranca.contrato.imovel.nome}</strong><small>{cobranca.contrato.inquilino.nome} · {cobranca.situacao}</small></span><b>{brl(Number(cobranca.valor_previsto) - Number(cobranca.valor_recebido))}</b></button>)}</div> : <p className="locacoes-empty">Nenhuma cobrança em aberto nesta competência.</p>}</div>
      <div className="card locacoes-attention-card"><div className="finance-card__header"><div><h2>Renovações próximas</h2><p>Contratos que vencem nos próximos 60 dias.</p></div></div>{dashboard.renovacoes.length ? <div className="locacoes-attention-list">{dashboard.renovacoes.map((contrato) => <button key={contrato.id} onClick={() => onSelectContrato(contrato.id)}><span><strong>{contrato.imovel.nome}</strong><small>{contrato.inquilino.nome}</small></span><b>{new Date(contrato.fim).toLocaleDateString("pt-BR")}</b></button>)}</div> : <p className="locacoes-empty">Nenhuma renovação prevista para os próximos 60 dias.</p>}</div>
    </section>
  </>;
}
