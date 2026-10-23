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
const { createDashboardService, getMesAnterior } = require('../../domain/dashboard.cjs');

const dependencies = {
  gastosFixosService: GastosFixosService,
  gastosVariaveisRepository: GastosVariaveisRepository,
  receitasService: ReceitasService,
  receitasRepository: ReceitasRepository,
  gastosFixosRepository: GastosFixosRepository,
  investimentosRepository: InvestimentosRepository,
  orcamentosRepository: OrcamentosRepository,
  metasRepository: MetasRepository,
  cartoesRepository: CartoesRepository,
};

const DashboardService = createDashboardService(dependencies, (message, statusCode) => new AppError(message, statusCode));

module.exports = { DashboardService, createDashboardService, getMesAnterior };
