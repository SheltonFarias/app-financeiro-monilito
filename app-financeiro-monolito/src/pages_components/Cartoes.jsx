import { fmt } from "../utils/format";

export default function Cartoes({ data = [], onAdd, onEdit }) {
  const totalLimite = data.reduce((s, c) => s + c.limite_total, 0);

  return (
    <div className="flex flex-col gap-16">
      <div className="card card--flat">
        <div className="tbl-header">
          <span className="tbl-header__title">Meus Cartões de Crédito</span>
          <button className="btn btn--teal btn--sm" onClick={onAdd}>+ Cartão</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nome do Cartão</th>
                <th>Limite Total</th>
                <th>Fechamento</th>
                <th>Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.nome}</td>
                  <td className="val val--blue">{fmt(c.limite_total)}</td>
                  <td>Dia {c.dia_fechamento}</td>
                  <td>Dia {c.dia_vencimento}</td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => onEdit(c)}>Editar</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                    Nenhum cartão cadastrado.
                  </td>
                </tr>
              )}
              {data.length > 0 && (
                <tr className="tbl__total">
                  <td>TOTAL DE LIMITES</td>
                  <td className="val val--blue">{fmt(totalLimite)}</td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
