const { GastosFixosRepository } = require('../gastos-fixos/gastosFixos.repository');
const { GastosVariaveisRepository } = require('../gastos-variaveis/gastosVariaveis.repository');
const { ReceitasRepository } = require('../receitas/receitas.repository');

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getNextMonths(mesAtual, numMonths) {
  const match = mesAtual.match(/([A-Za-zÀ-ú]+)(\d+)/);
  if (!match) return [];
  const mesNome = match[1];
  let ano = parseInt(match[2], 10);
  let idx = NOMES_MESES.indexOf(mesNome);
  
  if (idx === -1) return [];

  const meses = [mesAtual];
  for (let i = 0; i < numMonths; i++) {
    idx++;
    if (idx > 11) {
      idx = 0;
      ano++;
    }
    meses.push(NOMES_MESES[idx] + ano);
  }
  return meses;
}

const RelatoriosService = {
  /**
   * Calcula projeção do saldo atual e dos próximos meses (simulando que rendimentos e despesas recorrentes continuam)
   * Usa como "Saldo" base: Receitas totais do mes atual - Despesas totais
   */
  gerarProjecao(mesAtual) {
    const periodos = getNextMonths(mesAtual, 5); // atual + próximos 5
    
    let saldoSimulado = 0;
    
    // Calcula o saldo real/base do mes atual primeiro
    const recAtual = ReceitasRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    const varAtual = GastosVariaveisRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    const fixAtual = GastosFixosRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    saldoSimulado = recAtual - (varAtual + fixAtual);
    
    const recorrentes = GastosVariaveisRepository.findByMes(mesAtual).filter(g => g.recorrente === 1).reduce((s, r) => s + r.valor, 0);
    const fixosRec = GastosFixosRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0); // Gastos fixos por definição são meio recorrentes na simulação
    const receitasRec = ReceitasRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0); // Assumir receita igual para a projeção se não houver tag específica
    
    const projecao = [];
    projecao.push({ mes: mesAtual, saldo: saldoSimulado, tipo: 'real' });
    
    for (let i = 1; i < periodos.length; i++) {
      saldoSimulado += (receitasRec - (recorrentes + fixosRec));
      projecao.push({ mes: periodos[i], saldo: saldoSimulado, tipo: 'projetado' });
    }
    
    return projecao;
  },

  /**
   * Retorna agrupamento por categorias, focado em pizza chart
   */
  agruparPorCategoria(mes) {
    const varAtual = GastosVariaveisRepository.findByMes(mes);
    const fixAtual = GastosFixosRepository.findByMes(mes);
    
    const map = {};
    for (const g of varAtual) {
      map[g.categoria] = (map[g.categoria] || 0) + g.valor;
    }
    for (const g of fixAtual) {
      map[g.categoria] = (map[g.categoria] || 0) + g.valor;
    }
    
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }
};

module.exports = { RelatoriosService };
