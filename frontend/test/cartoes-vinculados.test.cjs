const assert = require('node:assert/strict');
const test = require('node:test');

test('cartões somam apenas lançamentos vinculados pelo nome do cartão', async () => {
  const { calcularResumoCartoes } = await import('../src/utils/cartoes.js');
  const [cartao] = calcularResumoCartoes(
    [{ id: '1', nome: 'Cartão Inter', limite_total: 1000 }],
    [{ descricao: 'Internet', valor: 120, cartao: 'Inter', situacao: 'Pago' }],
    [{ descricao: 'Mercado', valor: 230, pagamento: 'Cartão Inter', situacao: 'Pendente' }, { descricao: 'Pix', valor: 80, pagamento: 'Pix', situacao: 'Pendente' }],
  );

  assert.equal(cartao.faturaAtual, 350);
  assert.equal(cartao.pago, 120);
  assert.equal(cartao.pendente, 230);
  assert.equal(cartao.limiteDisponivel, 650);
  assert.equal(cartao.previsaoGastos, 350);
  assert.equal(cartao.margemPlanejada, 650);
  assert.equal(cartao.vinculados.length, 2);
});

test('cartão usa teto planejado para alertar antes do limite real', async () => {
  const { calcularResumoCartoes } = await import('../src/utils/cartoes.js');
  const [cartao] = calcularResumoCartoes(
    [{ id: '1', nome: 'Inter', limite_total: 1000, limite_planejado: 600 }],
    [{ descricao: 'Academia', valor: 250, cartao: 'Inter' }],
    [{ descricao: 'Mercado', valor: 420, pagamento: 'Inter' }],
  );

  assert.equal(cartao.previsaoGastos, 670);
  assert.equal(cartao.margemPlanejada, -70);
  assert.equal(cartao.utilizacaoPlanejada, 670 / 600 * 100);
});

test('formulário usa cartões cadastrados como formas de pagamento', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const modal = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Modal.jsx'), 'utf8');

  assert.match(modal, /cartoes\.map/);
  assert.match(modal, /formasNaoCartao/);
  assert.match(modal, /nomesCartoes/);
  assert.match(modal, /tipo === "Meta"\) processed\.valor_atual/);
  assert.match(modal, /incluirInvestimento/);
});

test('forma de pagamento de cartao informa seu dia de vencimento', async () => {
  const { obterDiaVencimentoCartao } = await import('../src/utils/cartoes.js');
  const cartoes = [
    { nome: 'Cartao Inter', dia_vencimento: 8 },
    { nome: 'Nubank', dia_vencimento: 15 },
  ];

  assert.equal(obterDiaVencimentoCartao(cartoes, 'Cartao Inter'), '8');
  assert.equal(obterDiaVencimentoCartao(cartoes, 'nubank'), '15');
  assert.equal(obterDiaVencimentoCartao(cartoes, 'Pix'), '');
});

test('gastos fixo e variavel bloqueiam vencimento quando a forma de pagamento e um cartao', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const modal = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Modal.jsx'), 'utf8');

  assert.match(modal, /isVencimentoAutomatico/);
  assert.match(modal, /disabled=\{isVencimentoAutomatico\}/);
  assert.match(modal, /const formaPagamento = tipo === "Gasto Fixo"/);
});

test('gasto fixo exibe a forma de pagamento antes do vencimento', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const modal = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Modal.jsx'), 'utf8');
  const inicio = modal.indexOf('"Gasto Fixo": [');
  const fim = modal.indexOf('"Gasto Variável": [');
  const camposGastoFixo = modal.slice(inicio, fim);

  assert.ok(camposGastoFixo.indexOf('key: "cartao"') < camposGastoFixo.indexOf('key: "vencimento"'));
});
