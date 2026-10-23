const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getMesAnterior(mesStr) {
  const match = mesStr?.match(/([A-Za-zÀ-ú]+)(\d+)/);
  if (!match) return null;
  const indice = NOMES_MESES.indexOf(match[1]);
  if (indice === -1) return null;
  return NOMES_MESES[indice === 0 ? 11 : indice - 1] + (indice === 0 ? Number(match[2]) - 1 : match[2]);
}

/**
 * Regra de negócio independente de framework/banco. Os adaptadores de cada
 * aplicação entregam as dependências (repositórios e serviços) na borda.
 */
function createDashboardService(dependencies, createError = (message, statusCode) => Object.assign(new Error(message), { statusCode })) {
  const {
    gastosFixosService,
    gastosVariaveisRepository,
    receitasService,
    receitasRepository,
    gastosFixosRepository,
    investimentosRepository,
    orcamentosRepository,
    metasRepository,
    cartoesRepository,
  } = dependencies;

  return {
    async carregarDados(mes) {
      if (!mes) throw createError('Parâmetro "mes" é obrigatório.', 400);

      const mesAnterior = getMesAnterior(mes);
      if (mesAnterior) {
        const anteriores = await gastosVariaveisRepository.findByMes(mesAnterior);
        const atuais = await gastosVariaveisRepository.findByMes(mes);
        for (const recorrente of anteriores.filter((gasto) => gasto.recorrente)) {
          const jaExiste = atuais.some((atual) =>
            atual.descricao === recorrente.descricao &&
            atual.valor === recorrente.valor &&
            atual.recorrente,
          );
          if (!jaExiste) {
            await gastosVariaveisRepository.create({
              categoria: recorrente.categoria,
              descricao: recorrente.descricao,
              valor: recorrente.valor,
              parcela: recorrente.parcela,
              data_compra: recorrente.data_compra,
              pagamento: recorrente.pagamento,
              situacao: 'Pendente',
              mes,
              subcategoria: recorrente.subcategoria,
              recorrente: true,
              frequencia: recorrente.frequencia,
              tags: recorrente.tags,
            });
          }
        }
      }

      const [gastosFixos, gastosVariaveis, receitas, investimentos, orcamentos, metas, cartoes] = await Promise.all([
        gastosFixosService.listarPorMes(mes),
        gastosVariaveisRepository.findByMes(mes),
        receitasService.listarPorMes(mes),
        investimentosRepository.findAll(),
        orcamentosRepository.findByMes(mes),
        metasRepository.findAll(),
        cartoesRepository.findAll(),
      ]);

      return { gastosFixos, gastosVariaveis, receitas, investimentos, orcamentos, metas, cartoes };
    },

    async carregarHistorico() {
      const [gastosFixos, gastosVariaveis, receitas] = await Promise.all([
        gastosFixosRepository.findAll(),
        gastosVariaveisRepository.findAll(),
        receitasRepository.findAll(),
      ]);
      return { gastosFixos, gastosVariaveis, receitas };
    },
  };
}

module.exports = { createDashboardService, getMesAnterior };
