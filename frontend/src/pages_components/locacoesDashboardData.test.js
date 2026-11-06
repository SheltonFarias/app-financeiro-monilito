import test from "node:test";
import assert from "node:assert/strict";
import { buildLocacoesDashboard } from "./locacoesDashboardData.js";

test("calcula ocupação, recebimento e saldo pendente da carteira", () => {
  const dashboard = buildLocacoesDashboard(
    [{ status: "Ocupado" }, { status: "Disponível" }],
    [{ status: "Ativo", aluguel_base: 1200, cobrancas: [{ competencia: "2026-11", valor_previsto: 1200, valor_recebido: 700, situacao: "Parcial" }] }],
    "2026-11",
  );

  assert.equal(dashboard.ocupados, 1);
  assert.equal(dashboard.previsto, 1200);
  assert.equal(dashboard.recebido, 700);
  assert.equal(dashboard.pendente, 500);
  assert.equal(dashboard.fluxo[0].previsto, 1200);
});
