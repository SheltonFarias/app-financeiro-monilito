/**
 * dashboard.controller.js — Handler das rotas do Dashboard.
 */
const { DashboardService } = require('./dashboard.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

/**
 * GET /api/dashboard?mes=Junho2026
 * Retorna dados do mês selecionado + todos os investimentos.
 */
const carregarDados = asyncHandler(async (req, res) => {
  const { mes } = req.query;
  const data = DashboardService.carregarDados(mes);
  sendSuccess(res, data);
});

/**
 * GET /api/dashboard/historico
 * Retorna todos os dados históricos para o gráfico de evolução mensal.
 */
const carregarHistorico = asyncHandler(async (req, res) => {
  const data = DashboardService.carregarHistorico();
  sendSuccess(res, data);
});

module.exports = { carregarDados, carregarHistorico };
