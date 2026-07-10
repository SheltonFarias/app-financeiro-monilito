/**
 * auth.service.js — Lógica de negócio de autenticação.
 * Valida a senha via variável de ambiente e gera o JWT.
 * Não conhece req/res do Express.
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('../../utils/AppError');
const { AUTH_PASSWORD, AUTH_USER, JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

const AuthService = {
  /**
   * Autentica o usuário com a senha configurada no .env.
   * @param {string} senha - Senha enviada pelo frontend
   * @returns {{ token: string, expiresIn: string }}
   * @throws {AppError} 401 se a senha estiver incorreta
   */
  login(senha) {
    if (!senha || senha !== AUTH_PASSWORD) {
      throw new AppError('Senha incorreta.', 401);
    }

    const token = jwt.sign(
      { authenticated: true, username: AUTH_USER },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { token, expiresIn: JWT_EXPIRES_IN, username: AUTH_USER };
  },
};

module.exports = { AuthService };
