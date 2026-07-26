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

/**
 * Converte "Julho2026" em um número absoluto para ordenação cronológica.
 */
function mesParaOrdem(mesStr) {
  if (!mesStr) return 0;
  for (let i = 0; i < NOMES_MESES.length; i++) {
    if (mesStr.startsWith(NOMES_MESES[i])) {
      const ano = parseInt(mesStr.slice(NOMES_MESES[i].length), 10);
      if (!isNaN(ano)) return ano * 12 + i;
    }
  }
  return 0;
}

const RelatoriosService = {
  /**
   * Calcula projeção do saldo para os próximos N meses.
   * @param {string} mesAtual
   * @param {number} [numMeses=11] — total de meses futuros (padrão: 11 = atual + 11 = 12 meses)
   */
  gerarProjecao(mesAtual, numMeses = 11) {
    const periodos = getNextMonths(mesAtual, numMeses);
    
    let saldoSimulado = 0;
    
    // Calcula o saldo real/base do mes atual primeiro
    const recAtual = ReceitasRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    const varAtual = GastosVariaveisRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    const fixAtual = GastosFixosRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    saldoSimulado = recAtual - (varAtual + fixAtual);
    
    const recorrentes    = GastosVariaveisRepository.findByMes(mesAtual).filter(g => g.recorrente === 1).reduce((s, r) => s + r.valor, 0);
    const fixosRec       = GastosFixosRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    const receitasRec    = ReceitasRepository.findByMes(mesAtual).reduce((s, r) => s + r.valor, 0);
    
    const projecao = [];
    projecao.push({ mes: mesAtual, saldo: saldoSimulado, tipo: 'real' });
    
    for (let i = 1; i < periodos.length; i++) {
      saldoSimulado += (receitasRec - (recorrentes + fixosRec));
      projecao.push({ mes: periodos[i], saldo: saldoSimulado, tipo: 'projetado' });
    }
    
    return projecao;
  },

  /**
   * Retorna agrupamento por categorias, focado em pizza chart.
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
  },

  /**
   * Retorna o histórico consolidado de todos os meses com dados no banco.
   * Cada entrada contém: mes, receita, gastos_fixos, gastos_variaveis, gastos_totais, saldo.
   * Ordenado cronologicamente.
   */
  historicoConsolidado() {
    const todasReceitas = ReceitasRepository.findAll();
    const todosFixos    = GastosFixosRepository.findAll();
    const todosVariaveis = GastosVariaveisRepository.findAll();

    // Coleta todos os meses distintos
    const mesesSet = new Set([
      ...todasReceitas.map(r => r.mes),
      ...todosFixos.map(g => g.mes),
      ...todosVariaveis.map(g => g.mes),
    ]);

    const historico = [...mesesSet].map(mes => {
      const receita        = todasReceitas.filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0);
      const gastos_fixos   = todosFixos.filter(g => g.mes === mes).reduce((s, g) => s + g.valor, 0);
      const gastos_variaveis = todosVariaveis.filter(g => g.mes === mes).reduce((s, g) => s + g.valor, 0);
      const gastos_totais  = gastos_fixos + gastos_variaveis;
      const saldo          = receita - gastos_totais;

      return { mes, receita, gastos_fixos, gastos_variaveis, gastos_totais, saldo };
    });

    // Ordena cronologicamente
    historico.sort((a, b) => mesParaOrdem(a.mes) - mesParaOrdem(b.mes));

    return historico;
  },

  /**
   * Compara dois meses lado a lado.
   * Retorna os totais de receita, gastos fixos, gastos variáveis e saldo para cada mês.
   * @param {string} mes1
   * @param {string} mes2
   */
  compararMeses(mes1, mes2) {
    const buildResumo = (mes) => {
      const receita          = ReceitasRepository.findByMes(mes).reduce((s, r) => s + r.valor, 0);
      const gastos_fixos     = GastosFixosRepository.findByMes(mes).reduce((s, g) => s + g.valor, 0);
      const gastos_variaveis = GastosVariaveisRepository.findByMes(mes).reduce((s, g) => s + g.valor, 0);
      const gastos_totais    = gastos_fixos + gastos_variaveis;
      const saldo            = receita - gastos_totais;
      return { mes, receita, gastos_fixos, gastos_variaveis, gastos_totais, saldo };
    };

    return {
      mes1: buildResumo(mes1),
      mes2: buildResumo(mes2),
    };
  },
};

module.exports = { RelatoriosService };
