/**
 * investimentos.controller.js — Handler das rotas de Investimentos.
 */
const { InvestimentosService } = require('./investimentos.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { investimentoSchema } = require('./investimentos.schema');

/** GET /api/investimentos */
const listar = asyncHandler(async (req, res) => {
  const data = InvestimentosService.listar();
  sendSuccess(res, data);
});

/** POST /api/investimentos */
const criar = asyncHandler(async (req, res) => {
  const dados = investimentoSchema.parse(req.body);
  const data = InvestimentosService.criar(dados);
  sendSuccess(res, data, 201);
});

/** PUT /api/investimentos/:id */
const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dados = investimentoSchema.parse(req.body);
  const data = InvestimentosService.atualizar(id, dados);
  sendSuccess(res, data);
});

/** DELETE /api/investimentos/:id */
const remover = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  InvestimentosService.remover(id);
  sendSuccess(res, { message: 'Registro removido com sucesso.' });
});

module.exports = { listar, criar, atualizar, remover };
