/**
 * auth.middleware.js — Middleware de autenticação JWT.
 * Verifica o header Authorization: Bearer <token>.
 * Injeta req.user com o payload decodificado em caso de sucesso.
 * Lança AppError 401 se o token estiver ausente, inválido ou expirado.
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/AppError');
const { JWT_SECRET } = require('../config/env');

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticação não fornecido.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    next(new AppError('Token inválido ou expirado.', 401));
  }
};

module.exports = { authMiddleware };
