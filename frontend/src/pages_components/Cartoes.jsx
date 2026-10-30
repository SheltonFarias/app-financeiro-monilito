import { fmt } from "../utils/format";
import { calcularResumoCartoes } from "../utils/cartoes";

export default function Cartoes({ data = [], gastosFixos = [], gastosVariaveis = [], onAdd, onEdit }) {
  const cartoes = calcularResumoCartoes(data, gastosFixos, gastosVariaveis);
  const totalLimite = cartoes.reduce((total, cartao) => total + Number(cartao.limite_total || 0), 0);
  const totalFatura = cartoes.reduce((total, cartao) => total + cartao.faturaAtual, 0);
  const totalPrevisao = cartoes.reduce((total, cartao) => total + cartao.previsaoGastos, 0);
  const margemPlanejada = cartoes.reduce((total, cartao) => total + cartao.margemPlanejada, 0);

  return <div className="flex flex-col gap-16">
    <div className="credit-summary-grid">
      <div className="card credit-summary-card"><span>Limite total</span><strong>{fmt(totalLimite)}</strong></div>
      <div className="card credit-summary-card"><span>Fatura no ciclo</span><strong>{fmt(totalFatura)}</strong></div>
      <div className="card credit-summary-card"><span>Previsão vinculada</span><strong>{fmt(totalPrevisao)}</strong></div>
      <div className="card credit-summary-card"><span>Margem planejada</span><strong className={margemPlanejada < 0 ? 'text-red' : ''}>{fmt(margemPlanejada)}</strong></div>
    </div>
    <div className="card card--flat">
      <div className="tbl-header"><div><span className="tbl-header__title">Meus Cartões de Crédito</span><div className="credit-header-help">A previsão reúne gastos fixos e variáveis vinculados. O teto planejado é sua faixa segura, abaixo do limite real.</div></div><button className="btn btn--teal btn--sm" onClick={onAdd}>+ Cartão</button></div>
      {cartoes.length === 0 ? <div className="empty-state"><div className="empty-state__text">Nenhum cartão cadastrado.</div></div> : <div className="credit-card-list">
        {cartoes.map((cartao) => {
          const alerta = cartao.margemPlanejada < 0 || cartao.utilizacao >= 90 ? 'credit-card--critical' : cartao.utilizacaoPlanejada >= 80 ? 'credit-card--attention' : '';
          return <article className={`credit-card ${alerta}`} key={cartao.id}>
            <div className="credit-card__header"><div><h3>{cartao.nome}</h3><span>Fecha dia {cartao.dia_fechamento} · vence dia {cartao.dia_vencimento}</span></div><button className="btn btn--ghost btn--sm" onClick={() => onEdit(cartao)}>Editar</button></div>
            <div className="credit-card__metrics"><div><span>Fatura no ciclo</span><strong>{fmt(cartao.faturaAtual)}</strong></div><div><span>Após fechamento</span><strong>{fmt(cartao.faturaFutura)}</strong></div><div><span>Previsão total</span><strong>{fmt(cartao.previsaoGastos)}</strong></div><div><span>Margem segura</span><strong className={cartao.margemPlanejada < 0 ? 'text-red' : ''}>{fmt(cartao.margemPlanejada)}</strong></div></div>
            <div className="credit-card__usage"><div><span>{cartao.vinculados.length} lançamento(s): {fmt(cartao.fixosVinculados)} fixos e {fmt(cartao.variaveisVinculados)} variáveis</span><strong>{cartao.utilizacaoPlanejada.toFixed(1)}% do teto planejado ({fmt(cartao.limitePlanejado)})</strong></div><div className="credit-card__track"><div style={{ width: `${Math.min(100, cartao.utilizacaoPlanejada)}%` }} /></div></div>
            {cartao.vinculados.length > 0 && <div className="credit-card__items">{cartao.vinculados.map((lancamento, indice) => <div key={`${lancamento.id || lancamento.descricao}-${indice}`}><span>{lancamento.descricao} <small>· {lancamento.origem}</small></span><strong>{fmt(lancamento.valor)}</strong></div>)}</div>}
          </article>;
        })}
      </div>}
    </div>
  </div>;
}
