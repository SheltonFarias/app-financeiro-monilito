/**
 * auth.middleware.js — Middleware de autenticação JWT.
 * Verifica o header Authorization: Bearer <token>.
 * Injeta req.user com o payload decodificado em caso de sucesso.
 * Lança AppError 401 se o token estiver ausente, inválido ou expirado.
 */
const { jwtVerify } = require('jose');
const { AppError } = require('../utils/AppError');
const { JWT_SECRET } = require('../config/env');

const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticação não fornecido.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, secret);
    req.user = payload;
    next();
  } catch {
    next(new AppError('Token inválido ou expirado.', 401));
  }
};

module.exports = { authMiddleware };
