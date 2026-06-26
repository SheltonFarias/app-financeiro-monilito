/**
 * dashboard.service.js — Agrega dados de todos os módulos em uma única resposta.
 * Substitui o comportamento do "loadData" do Apps Script.
 * Também retorna dados de todos os meses para o gráfico de evolução mensal.
 */
const { GastosFixosRepository } = require('../gastos-fixos/gastosFixos.repository');
const { GastosVariaveisRepository } = require('../gastos-variaveis/gastosVariaveis.repository');
const { ReceitasRepository } = require('../receitas/receitas.repository');
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
  carregarDados(mes) {
    if (!mes) throw new AppError('Parâmetro "mes" é obrigatório.', 400);

    // Lógica de Recorrência (Gastos Variáveis)
    const mesAnt = getMesAnterior(mes);
    if (mesAnt) {
      const recorrentesAnteriores = GastosVariaveisRepository.findByMes(mesAnt).filter(g => g.recorrente === 1);
      const atuais = GastosVariaveisRepository.findByMes(mes);
      
      for (const rec of recorrentesAnteriores) {
        // Verifica se já foi copiado
        const jaExiste = atuais.some(a => a.descricao === rec.descricao && a.valor === rec.valor && a.recorrente === 1);
        if (!jaExiste) {
          GastosVariaveisRepository.create({
            categoria: rec.categoria,
            descricao: rec.descricao,
            valor: rec.valor,
            parcela: rec.parcela,
            data_compra: rec.data_compra,
            pagamento: rec.pagamento,
            situacao: 'Pendente',
            mes: mes,
            subcategoria: rec.subcategoria,
            recorrente: 1,
            frequencia: rec.frequencia,
            tags: rec.tags,
          });
        }
      }
    }

    const gastosFixos     = GastosFixosRepository.findByMes(mes);
    const gastosVariaveis = GastosVariaveisRepository.findByMes(mes);
    const receitas        = ReceitasRepository.findByMes(mes);
    const investimentos   = InvestimentosRepository.findAll();
    const orcamentos      = OrcamentosRepository.findByMes(mes);
    const metas           = MetasRepository.findAll();
    const cartoes         = CartoesRepository.findAll();

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
   * @returns {{
   *   gastosFixos: Object[],
   *   gastosVariaveis: Object[],
   *   receitas: Object[]
   * }}
   */
  carregarHistorico() {
    return {
      gastosFixos:     GastosFixosRepository.findAll(),
      gastosVariaveis: GastosVariaveisRepository.findAll(),
      receitas:        ReceitasRepository.findAll(),
    };
  },
};

module.exports = { DashboardService };
