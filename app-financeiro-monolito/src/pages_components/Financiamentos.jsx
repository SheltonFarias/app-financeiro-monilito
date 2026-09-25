"use client";

import { useEffect, useState } from "react";
import FinanciamentoDashboard from "./FinanciamentoDashboard";
import { addAmortizacao, addFinanciamento, addPagamento, deleteAmortizacao, deletePagamento, editAmortizacao, getFinanciamento, getFinanciamentos, getTabelaFinanciamento, simularAmortizacao } from "../utils/apiService";

const hoje = new Date().toISOString().slice(0, 10);
const inicial = { descricao: "", banco: "", valorImovel: "", valorFinanciado: "", taxaJurosNominalAnual: "", prazoMeses: 360, dataInicio: hoje, prestacaoInicialAj: "", totalMensalInicial: "", sistemaAmort: "PRICE", indiceCorrecao: "TR", recursosProprios: 0, descontoFgts: 0, parcelaAtual: 1, seguroMensal: 0, tarifaAdministracao: 0 };
const brl = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
const isoDate = (valor) => new Date(valor).toISOString().slice(0, 10);

function Campo({ label, children, wide = false }) {
  return <label className={`finance-field${wide ? " finance-field--wide" : ""}`}><span>{label}</span>{children}</label>;
}

export default function Financiamentos() {
  const [contratos, setContratos] = useState([]);
  const [contrato, setContrato] = useState(null);
  const [tabela, setTabela] = useState([]);
  const [form, setForm] = useState(inicial);
  const [erro, setErro] = useState("");
  const [aporte, setAporte] = useState({ parcelaReferencia: 1, dataPagamento: hoje, valor: "", modalidade: "REDUZ_PRAZO", observacao: "" });
  const [simulacao, setSimulacao] = useState(null);
  const [amortizacaoEditando, setAmortizacaoEditando] = useState(null);
  const [pagamento, setPagamento] = useState({ numeroParcela: 1, dataVencimento: hoje, dataPagamentoReal: hoje, valorPago: "", seguroPago: "", observacao: "" });

  const carregar = async () => { try { setContratos(await getFinanciamentos()); } catch (e) { setErro(e.message); } };
  useEffect(() => { carregar(); }, []);

  const abrir = async (id) => {
    try {
      const [item, linhas] = await Promise.all([getFinanciamento(id), getTabelaFinanciamento(id)]);
      const linhaAtual = linhas.find((linha) => linha.parcela === item.parcela_atual);
      setContrato(item); setTabela(linhas);
      setAporte((a) => ({ ...a, parcelaReferencia: item.parcela_atual }));
      setPagamento((atual) => ({ ...atual, numeroParcela: item.parcela_atual, dataVencimento: linhaAtual ? isoDate(linhaAtual.data_vencimento) : hoje, valorPago: linhaAtual?.prestacao || "" }));
      setSimulacao(null); setAmortizacaoEditando(null); setErro("");
    } catch (e) { setErro(e.message); }
  };
  const alterar = (e) => {
    const { name, value } = e.target;
    const numeros = ["valorImovel", "valorFinanciado", "taxaJurosNominalAnual", "prazoMeses", "prestacaoInicialAj", "totalMensalInicial"];
    setForm((f) => ({ ...f, [name]: numeros.includes(name) ? Number(value) : value }));
  };
  const criar = async (e) => { e.preventDefault(); try { const novo = await addFinanciamento(form); setForm(inicial); await carregar(); await abrir(novo.id); } catch (err) { setErro(err.message); } };
  const simular = async (e) => { e.preventDefault(); try { setSimulacao(await simularAmortizacao(contrato.id, { ...aporte, parcelaReferencia: Number(aporte.parcelaReferencia), valor: Number(aporte.valor) })); } catch (err) { setErro(err.message); } };
  const confirmar = async () => {
    try {
      const dados = { ...aporte, parcelaReferencia: Number(aporte.parcelaReferencia), valor: Number(aporte.valor) };
      if (amortizacaoEditando) await editAmortizacao(contrato.id, amortizacaoEditando, dados); else await addAmortizacao(contrato.id, dados);
      await abrir(contrato.id); await carregar(); setAporte((a) => ({ ...a, valor: "", observacao: "" })); setAmortizacaoEditando(null);
    } catch (err) { setErro(err.message); }
  };
  const registrarPagamento = async (e) => { e.preventDefault(); try { await addPagamento(contrato.id, { ...pagamento, numeroParcela: Number(pagamento.numeroParcela), valorPago: Number(pagamento.valorPago), seguroPago: pagamento.seguroPago === "" ? null : Number(pagamento.seguroPago) }); await abrir(contrato.id); await carregar(); } catch (err) { setErro(err.message); } };
  const removerPagamento = async (id) => { if (window.confirm("Remover este pagamento?")) { try { await deletePagamento(contrato.id, id); await abrir(contrato.id); await carregar(); } catch (err) { setErro(err.message); } } };
  const removerAmortizacao = async (id) => { if (window.confirm("Remover esta amortização?")) { try { await deleteAmortizacao(contrato.id, id); await abrir(contrato.id); await carregar(); } catch (err) { setErro(err.message); } } };
  const editarAmortizacao = (item) => { setAporte({ parcelaReferencia: item.parcela_referencia, dataPagamento: isoDate(item.data_pagamento), valor: item.valor, modalidade: item.modalidade, observacao: item.observacao || "" }); setAmortizacaoEditando(item.id); setSimulacao(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return <div className="page finance-page">
    {contrato && <FinanciamentoDashboard contrato={contrato} tabela={tabela} />}
    <div className="page-header"><div><h1>Financiamentos</h1><p>Contratos, parcelas e amortizações extraordinárias.</p></div></div>
    {erro && <p className="error-state__msg" role="alert">{erro}</p>}

    <section className="card finance-card"><div className="finance-card__header"><h2>Novo financiamento</h2><p>Informe os dados iniciais do contrato.</p></div><form className="finance-form" onSubmit={criar}>
      <Campo label="Descrição"><input required name="descricao" value={form.descricao} onChange={alterar} placeholder="Ex.: Apartamento" /></Campo>
      <Campo label="Banco"><input required name="banco" value={form.banco} onChange={alterar} placeholder="Ex.: Caixa" /></Campo>
      <Campo label="Valor do imóvel"><input required type="number" min="0" step="0.01" name="valorImovel" value={form.valorImovel} onChange={alterar} placeholder="0,00" /></Campo>
      <Campo label="Valor financiado"><input required type="number" min="0" step="0.01" name="valorFinanciado" value={form.valorFinanciado} onChange={alterar} placeholder="0,00" /></Campo>
      <Campo label="Juros anual (%)"><input required type="number" min="0" step="0.0001" name="taxaJurosNominalAnual" value={form.taxaJurosNominalAnual} onChange={alterar} placeholder="0,00" /></Campo>
      <Campo label="Prazo (meses)"><input required type="number" min="1" name="prazoMeses" value={form.prazoMeses} onChange={alterar} /></Campo>
      <Campo label="Início do contrato"><input required type="date" name="dataInicio" value={form.dataInicio} onChange={alterar} /></Campo>
      <Campo label="Prestação inicial"><input required type="number" min="0" step="0.01" name="prestacaoInicialAj" value={form.prestacaoInicialAj} onChange={alterar} placeholder="0,00" /></Campo>
      <Campo label="Total mensal inicial"><input required type="number" min="0" step="0.01" name="totalMensalInicial" value={form.totalMensalInicial} onChange={alterar} placeholder="0,00" /></Campo>
      <Campo label="Sistema de amortização"><select name="sistemaAmort" value={form.sistemaAmort} onChange={alterar}><option value="PRICE">PRICE</option><option value="SAC">SAC</option></select></Campo>
      <div className="finance-form__action"><button className="btn btn--teal" type="submit">Cadastrar financiamento</button></div>
    </form></section>

    <section className="card finance-card"><div className="finance-card__header"><h2>Contratos cadastrados</h2><p>Escolha um contrato para consultar ou registrar movimentações.</p></div>{contratos.length ? <div className="finance-contracts">{contratos.map((item) => <button key={item.id} className={`finance-contract${contrato?.id === item.id ? " finance-contract--active" : ""}`} onClick={() => abrir(item.id)}><span><strong>{item.descricao}</strong><small>{item.banco}</small></span><strong>{brl(item.valor_financiado)}</strong></button>)}</div> : <p className="finance-empty">Nenhum financiamento cadastrado.</p>}</section>

    {contrato && <>
      <section className="card finance-card"><div className="finance-card__header"><h2>{amortizacaoEditando ? "Editar amortização" : "Simular amortização"}</h2><p>Parcela atual: {contrato.parcela_atual} de {contrato.prazo_meses}</p></div><form className="finance-form finance-form--compact" onSubmit={simular}>
        <Campo label="Parcela"><input type="number" min="1" value={aporte.parcelaReferencia} onChange={(e) => setAporte({ ...aporte, parcelaReferencia: e.target.value })} /></Campo>
        <Campo label="Data do aporte"><input required type="date" value={aporte.dataPagamento} onChange={(e) => setAporte({ ...aporte, dataPagamento: e.target.value })} /></Campo>
        <Campo label="Valor"><input required type="number" min="0.01" step="0.01" value={aporte.valor} onChange={(e) => setAporte({ ...aporte, valor: e.target.value })} placeholder="0,00" /></Campo>
        <Campo label="Modalidade"><select value={aporte.modalidade} onChange={(e) => setAporte({ ...aporte, modalidade: e.target.value })}><option value="REDUZ_PRAZO">Reduzir prazo</option><option value="REDUZ_PRESTACAO">Reduzir prestação</option></select></Campo>
        <Campo label="Observação" wide><input maxLength="500" value={aporte.observacao} onChange={(e) => setAporte({ ...aporte, observacao: e.target.value })} placeholder="Opcional" /></Campo>
        <div className="finance-form__action"><button className="btn btn--teal" type="submit">{amortizacaoEditando ? "Simular alterações" : "Simular aporte"}</button></div>
      </form>{simulacao && <div className="finance-result"><p><strong>Economia estimada: {brl(simulacao.economia_juros)}</strong><span>{simulacao.meses_economizados} meses economizados</span></p><button className="btn btn--teal" onClick={confirmar}>{amortizacaoEditando ? "Salvar amortização" : "Confirmar amortização"}</button></div>}</section>

      <section className="card finance-card"><div className="finance-card__header"><h2>Registrar pagamento de parcela</h2><p>Registre pagamentos realizados para acompanhar o contrato.</p></div><form className="finance-form finance-form--compact" onSubmit={registrarPagamento}>
        <Campo label="Parcela"><input required type="number" min="1" max={contrato.prazo_meses} value={pagamento.numeroParcela} onChange={(e) => setPagamento({ ...pagamento, numeroParcela: e.target.value })} /></Campo><Campo label="Vencimento"><input required type="date" value={pagamento.dataVencimento} onChange={(e) => setPagamento({ ...pagamento, dataVencimento: e.target.value })} /></Campo><Campo label="Data de pagamento"><input required type="date" value={pagamento.dataPagamentoReal} onChange={(e) => setPagamento({ ...pagamento, dataPagamentoReal: e.target.value })} /></Campo><Campo label="Valor pago"><input required type="number" min="0.01" step="0.01" value={pagamento.valorPago} onChange={(e) => setPagamento({ ...pagamento, valorPago: e.target.value })} /></Campo><Campo label="Seguro pago"><input type="number" min="0" step="0.01" value={pagamento.seguroPago} onChange={(e) => setPagamento({ ...pagamento, seguroPago: e.target.value })} /></Campo><Campo label="Observação" wide><input maxLength="500" value={pagamento.observacao} onChange={(e) => setPagamento({ ...pagamento, observacao: e.target.value })} placeholder="Opcional" /></Campo><div className="finance-form__action"><button className="btn btn--teal" type="submit">Confirmar pagamento</button></div>
      </form></section>

      <section className="card finance-card"><div className="finance-card__header"><h2>Tabela projetada</h2><p>Próximas 24 parcelas do financiamento.</p></div><div className="finance-table-wrap"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Prestação</th><th>Juros</th><th>Correção</th><th>Amortização</th><th>Saldo</th></tr></thead><tbody>{tabela.slice(0, 24).map((linha) => <tr key={linha.parcela}><td>{linha.parcela}</td><td>{new Date(linha.data_vencimento).toLocaleDateString("pt-BR")}</td><td>{brl(linha.prestacao)}</td><td>{brl(linha.juros)}</td><td>{brl(linha.correcao_indice)}</td><td>{brl(linha.amortizacao)}</td><td>{brl(linha.saldo_devedor)}</td></tr>)}</tbody></table></div></section>
    </>}

    {contrato?.amortizacoes_extras?.length > 0 && <section className="card finance-card"><div className="finance-card__header"><h2>Amortizações registradas</h2><p>Selecione uma amortização para alterar seus dados.</p></div><div className="finance-table-wrap"><table><thead><tr><th>Parcela</th><th>Data</th><th>Modalidade</th><th>Valor</th><th>Economia</th><th>Ações</th></tr></thead><tbody>{contrato.amortizacoes_extras.map((item) => <tr key={item.id}><td>{item.parcela_referencia}</td><td>{new Date(item.data_pagamento).toLocaleDateString("pt-BR")}</td><td>{item.modalidade === "REDUZ_PRAZO" ? "Reduzir prazo" : "Reduzir prestação"}</td><td>{brl(item.valor)}</td><td>{brl(item.economia_juros)}</td><td className="finance-actions"><button className="btn btn--ghost" onClick={() => editarAmortizacao(item)}>Editar</button><button className="btn btn--red" onClick={() => removerAmortizacao(item.id)}>Excluir</button></td></tr>)}</tbody></table></div></section>}
    {contrato?.parcelas_pagas?.length > 0 && <section className="card finance-card"><div className="finance-card__header"><h2>Pagamentos registrados</h2><p>Para corrigir um pagamento, exclua-o e registre novamente.</p></div><div className="finance-table-wrap"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Pago em</th><th>Valor</th><th>Ação</th></tr></thead><tbody>{contrato.parcelas_pagas.map((item) => <tr key={item.id}><td>{item.numero_parcela}</td><td>{new Date(item.data_vencimento).toLocaleDateString("pt-BR")}</td><td>{item.data_pagamento_real ? new Date(item.data_pagamento_real).toLocaleDateString("pt-BR") : "—"}</td><td>{brl(item.valor_pago)}</td><td><button className="btn btn--red" onClick={() => removerPagamento(item.id)}>Excluir</button></td></tr>)}</tbody></table></div></section>}
  </div>;
}
