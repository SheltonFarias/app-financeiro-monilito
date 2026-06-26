/**
 * gastosFixos.controller.js — Handler das rotas de Gastos Fixos.
 * Responsável APENAS por: receber req, chamar service, enviar res.
 * Toda lógica de negócio está no GastosFixosService.
 */
const { GastosFixosService } = require('./gastosFixos.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { gastoFixoSchema, updateStatusSchema } = require('./gastosFixos.schema');

/** GET /api/gastos-fixos?mes=Junho2026 */
const listar = asyncHandler(async (req, res) => {
  const { mes } = req.query;
  const data = GastosFixosService.listarPorMes(mes);
  sendSuccess(res, data);
});

/** POST /api/gastos-fixos */
const criar = asyncHandler(async (req, res) => {
  const dados = gastoFixoSchema.parse(req.body);
  const data = GastosFixosService.criar(dados);
  sendSuccess(res, data, 201);
});

/** PUT /api/gastos-fixos/:id */
const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dados = gastoFixoSchema.parse(req.body);
  const data = GastosFixosService.atualizar(id, dados);
  sendSuccess(res, data);
});

/** PATCH /api/gastos-fixos/:id/status */
const atualizarStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { situacao } = updateStatusSchema.parse(req.body);
  const data = GastosFixosService.atualizarStatus(id, situacao);
  sendSuccess(res, data);
});

/** DELETE /api/gastos-fixos/:id */
const remover = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  GastosFixosService.remover(id);
  sendSuccess(res, { message: 'Registro removido com sucesso.' });
});

module.exports = { listar, criar, atualizar, atualizarStatus, remover };
