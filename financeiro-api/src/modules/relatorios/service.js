const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const somar = (items) => items.reduce((total, item) => total + item.valor, 0);

function proximosMeses(mes, quantidade) {
  const nome = MESES.find((item) => mes.startsWith(item));
  const anoInicial = Number(mes.slice(nome?.length));
  if (!nome || !Number.isInteger(anoInicial)) return [];
  let indice = MESES.indexOf(nome); let ano = anoInicial;
  return Array.from({ length: quantidade + 1 }, (_, posicao) => {
    if (posicao) { indice += 1; if (indice === 12) { indice = 0; ano += 1; } }
    return `${MESES[indice]}${ano}`;
  });
}

function ordemMes(mes) {
  const nome = MESES.find((item) => mes.startsWith(item));
  return nome ? Number(mes.slice(nome.length)) * 12 + MESES.indexOf(nome) : 0;
}

export function createRelatoriosService(prisma) {
  const porMes = async (mes) => Promise.all([
    prisma.receita.findMany({ where: { mes } }), prisma.gastoFixo.findMany({ where: { mes } }), prisma.gastoVariavel.findMany({ where: { mes } }),
  ]);
  const resumo = async (mes) => {
    const [receitas, fixos, variaveis] = await porMes(mes);
    const receita = somar(receitas); const gastos_fixos = somar(fixos); const gastos_variaveis = somar(variaveis);
    return { mes, receita, gastos_fixos, gastos_variaveis, gastos_totais: gastos_fixos + gastos_variaveis, saldo: receita - gastos_fixos - gastos_variaveis };
  };
  return {
    async gerarProjecao(mes, quantidade = 11) {
      const [receitas, fixos, variaveis] = await porMes(mes);
      let saldo = somar(receitas) - somar(fixos) - somar(variaveis);
      const recorrentes = somar(variaveis.filter((item) => item.recorrente));
      return proximosMeses(mes, quantidade).map((periodo, indice) => {
        if (indice) saldo += somar(receitas) - somar(fixos) - recorrentes;
        return { mes: periodo, saldo, tipo: indice ? 'projetado' : 'real' };
      });
    },
    async agruparPorCategoria(mes) {
      const [, fixos, variaveis] = await porMes(mes);
      const totais = [...variaveis, ...fixos].reduce((mapa, item) => ({ ...mapa, [item.categoria]: (mapa[item.categoria] || 0) + item.valor }), {});
      return Object.entries(totais).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    },
    async historicoConsolidado() {
      const [receitas, fixos, variaveis] = await Promise.all([prisma.receita.findMany(), prisma.gastoFixo.findMany(), prisma.gastoVariavel.findMany()]);
      const meses = new Set([...receitas, ...fixos, ...variaveis].map((item) => item.mes));
      return [...meses].map((mes) => {
        const receita = somar(receitas.filter((item) => item.mes === mes)); const gastos_fixos = somar(fixos.filter((item) => item.mes === mes)); const gastos_variaveis = somar(variaveis.filter((item) => item.mes === mes));
        return { mes, receita, gastos_fixos, gastos_variaveis, gastos_totais: gastos_fixos + gastos_variaveis, saldo: receita - gastos_fixos - gastos_variaveis };
      }).sort((a, b) => ordemMes(a.mes) - ordemMes(b.mes));
    },
    async compararMeses(mes1, mes2) { return { mes1: await resumo(mes1), mes2: await resumo(mes2) }; },
  };
}
