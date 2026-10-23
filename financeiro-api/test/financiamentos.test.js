import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularTabela, simularAmortizacao } from '../src/modules/financiamentos/calculadora.js';
const contrato = { valor_financiado: 1200, taxa_juros_nominal_anual: 0, prazo_meses: 12, data_inicio: new Date('2026-01-01T00:00:00Z'), indice_correcao: 'NENHUM', sistema_amort: 'PRICE', seguro_mensal: 0, tarifa_administracao: 0, parcela_atual: 1 };
test('tabela PRICE sem juros amortiza o saldo integralmente', () => { const tabela = calcularTabela(contrato); assert.equal(tabela.length, 12); assert.equal(Math.round(tabela[0].prestacao), 100); assert.equal(Math.round(tabela.at(-1).saldo_devedor), 0); });
test('simulação de redução de prazo produz economia e saldo menor', () => { const tabela = calcularTabela({ ...contrato, taxa_juros_nominal_anual: 12 }); const simulacao = simularAmortizacao({ ...contrato, taxa_juros_nominal_anual: 12 }, tabela, { parcela_referencia: 2, valor: 200, modalidade: 'REDUZ_PRAZO' }); assert.ok(simulacao.economia_juros > 0); assert.ok(simulacao.novo_saldo_devedor < tabela[1].saldo_devedor); });
