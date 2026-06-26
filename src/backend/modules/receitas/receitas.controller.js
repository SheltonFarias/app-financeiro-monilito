/**
 * receitas.controller.js — Handler das rotas de Receitas.
 */
const { ReceitasService } = require('./receitas.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const { receitaSchema, updateStatusSchema } = require('./receitas.schema');

const listar = asyncHandler(async (req, res) => {
  const { mes } = req.query;
  const data = ReceitasService.listarPorMes(mes);
  sendSuccess(res, data);
});

const criar = asyncHandler(async (req, res) => {
  const dados = receitaSchema.parse(req.body);
  const data = ReceitasService.criar(dados);
  sendSuccess(res, data, 201);
});

const atualizar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const dados = receitaSchema.parse(req.body);
  const data = ReceitasService.atualizar(id, dados);
  sendSuccess(res, data);
});

const atualizarStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { situacao } = updateStatusSchema.parse(req.body);
  const data = ReceitasService.atualizarStatus(id, situacao);
  sendSuccess(res, data);
});

const remover = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  ReceitasService.remover(id);
  sendSuccess(res, { message: 'Registro removido com sucesso.' });
});

module.exports = { listar, criar, atualizar, atualizarStatus, remover };
