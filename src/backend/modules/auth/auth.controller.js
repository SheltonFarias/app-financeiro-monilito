/**
 * auth.controller.js — Handler das rotas de autenticação.
 * Responsável APENAS por: receber req, chamar service, enviar res.
 * Toda lógica está no AuthService.
 */
const { AuthService } = require('./auth.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

/**
 * POST /api/auth/login
 * Body: { senha: string }
 */
const login = asyncHandler(async (req, res) => {
  const { senha } = req.body;
  const data = AuthService.login(senha);
  sendSuccess(res, data);
});

/**
 * GET /api/auth/ping
 * Rota protegida — apenas verifica se o token é válido.
 * O authMiddleware já garante a autenticação antes de chegar aqui.
 */
const ping = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Autenticado com sucesso' });
});

module.exports = { login, ping };
