/**
 * gastosVariaveis.controller.js — Handler das rotas de Gastos Variáveis.
 */
const { GastosVariaveisService } = require('./gastosVariaveis.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { gastoVariavelSchema, updateStatusSchema } = require('./gastosVariaveis.schema');

/** GET /api/gastos-variaveis?mes=Junho2026 */
const listar = asyncHandler(async (req, res) => {
  const { mes } = req.query;
  const data = GastosVariaveisService.listarPorMes(mes);
  sendSuccess(res, data);
});

/** POST /api/gastos-variaveis */
const criar = asyncHandler(async (req, res) => {
  const dados = gastoVariavelSchema.parse(req.body);
  const data = GastosVariaveisService.criar(dados);
  sendSuccess(res, data, 201);
});

/** PUT /api/gastos-variaveis/:id */
const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dados = gastoVariavelSchema.parse(req.body);
  const data = GastosVariaveisService.atualizar(id, dados);
  sendSuccess(res, data);
});

/** PATCH /api/gastos-variaveis/:id/status */
const atualizarStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { situacao } = updateStatusSchema.parse(req.body);
  const data = GastosVariaveisService.atualizarStatus(id, situacao);
  sendSuccess(res, data);
});

/** DELETE /api/gastos-variaveis/:id */
const remover = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  GastosVariaveisService.remover(id);
  sendSuccess(res, { message: 'Registro removido com sucesso.' });
});

/** DELETE /api/gastos-variaveis/:id/serie */
const removerSerie = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  GastosVariaveisService.removerSerie(id);
  sendSuccess(res, { message: 'Série removida com sucesso.' });
});

module.exports = { listar, criar, atualizar, atualizarStatus, remover, removerSerie };
