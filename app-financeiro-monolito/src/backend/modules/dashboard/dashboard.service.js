/**
 * dashboard.service.js — Agrega dados de todos os módulos em uma única resposta.
 * Substitui o comportamento do "loadData" do Apps Script.
 * Também retorna dados de todos os meses para o gráfico de evolução mensal.
 */
const { GastosFixosService } = require('../gastos-fixos/gastosFixos.service');
const { GastosVariaveisRepository } = require('../gastos-variaveis/gastosVariaveis.repository');
const { ReceitasService } = require('../receitas/receitas.service');
const { ReceitasRepository } = require('../receitas/receitas.repository');
const { GastosFixosRepository } = require('../gastos-fixos/gastosFixos.repository');
const { InvestimentosRepository } = require('../investimentos/investimentos.repository');
const { OrcamentosRepository } = require('../orcamentos/orcamentos.repository');
const { MetasRepository } = require('../metas/metas.repository');
const { CartoesRepository } = require('../cartoes/cartoes.repository');
const { AppError } = require('../../utils/AppError');

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function getMesAnterior(mesStr) {
  const match = mesStr.match(/([A-Za-zÀ-ú]+)(\d+)/);
  if (!match) return null;
  const mesNome = match[1];
  const ano = parseInt(match[2], 10);
  let idx = NOMES_MESES.indexOf(mesNome);
  if (idx === -1) return null;
  
  if (idx === 0) {
    return NOMES_MESES[11] + (ano - 1);
  } else {
    return NOMES_MESES[idx - 1] + ano;
  }
}

const DashboardService = {
  async carregarDados(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);

    // Lógica de Recorrência (Gastos Variáveis)
    const mesAnt = getMesAnterior(mes);
    if (mesAnt) {
      const gvAnt = await GastosVariaveisRepository.findByMes(mesAnt);
      const recorrentesAnteriores = gvAnt.filter(g => g.recorrente);
      const atuais = await GastosVariaveisRepository.findByMes(mes);
      
      for (const rec of recorrentesAnteriores) {
        // Verifica se já foi copiado
        const jaExiste = atuais.some(a => a.descricao === rec.descricao && a.valor === rec.valor && a.recorrente);
        if (!jaExiste) {
          await GastosVariaveisRepository.create({
            categoria: rec.categoria,
            descricao: rec.descricao,
            valor: rec.valor,
            parcela: rec.parcela,
            data_compra: rec.data_compra,
            pagamento: rec.pagamento,
            situacao: 'Pendente',
            mes: mes,
            subcategoria: rec.subcategoria,
            recorrente: true,
            frequencia: rec.frequencia,
            tags: rec.tags,
          });
        }
      }
    }

    const [
      gastosFixos,
      gastosVariaveis,
      receitas,
      investimentos,
      orcamentos,
      metas,
      cartoes
    ] = await Promise.all([
      GastosFixosService.listarPorMes(mes),
      GastosVariaveisRepository.findByMes(mes),
      ReceitasService.listarPorMes(mes),
      InvestimentosRepository.findAll(),
      OrcamentosRepository.findByMes(mes),
      MetasRepository.findAll(),
      CartoesRepository.findAll()
    ]);

    return {
      gastosFixos,
      gastosVariaveis,
      receitas,
      investimentos,
      orcamentos,
      metas,
      cartoes,
    };
  },

  /**
   * Carrega TODOS os dados históricos (todos os meses) para evolução mensal.
   * Usado pelo gráfico de evolução do frontend.
   *
   * @returns {Promise<{
   *   gastosFixos: Object[],
   *   gastosVariaveis: Object[],
   *   receitas: Object[]
   * }>}
   */
  async carregarHistorico() {
    const [gastosFixos, gastosVariaveis, receitas] = await Promise.all([
      GastosFixosRepository.findAll(),
      GastosVariaveisRepository.findAll(),
      ReceitasRepository.findAll(),
    ]);

    return { gastosFixos, gastosVariaveis, receitas };
  },
};

module.exports = { DashboardService };
