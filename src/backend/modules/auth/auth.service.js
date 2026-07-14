/**
 * auth.service.js — Lógica de negócio de autenticação.
 * Compara a senha via bcryptjs (hash no .env) e gera o JWT com jose.
 * Não conhece req/res do Express.
 */
const bcrypt = require('bcryptjs');
const { SignJWT } = require('jose');
const { AppError } = require('../../utils/AppError');
const { AUTH_PASSWORD_HASH, AUTH_USER, JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

/** Converte a string do JWT_SECRET em Uint8Array para o jose */
const secret = new TextEncoder().encode(JWT_SECRET);

const AuthService = {
  /**
   * Autentica o usuário comparando a senha com o hash bcrypt armazenado no .env.
   * @param {string} senha - Senha enviada pelo frontend
   * @returns {Promise<{ token: string, expiresIn: string, username: string }>}
   * @throws {AppError} 401 se a senha estiver incorreta
   */
  async login(senha) {
    if (!senha) {
      throw new AppError('Senha não informada.', 401);
    }

    const senhaValida = await bcrypt.compare(senha, AUTH_PASSWORD_HASH);
    if (!senhaValida) {
      throw new AppError('Senha incorreta.', 401);
    }

    const token = await new SignJWT({ authenticated: true, username: AUTH_USER })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    return { token, expiresIn: JWT_EXPIRES_IN, username: AUTH_USER };
  },
};

module.exports = { AuthService };
