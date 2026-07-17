/**
 * auth.service.js — Lógica de negócio de autenticação.
 * Compara a senha via bcryptjs (hash no .env) e gera o JWT com jose.
 * Usa ESModules para compatibilidade com o Next.js App Router (runtime nodejs).
 */
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

/** Classe de erro customizada com statusCode HTTP */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/** Converte a string do JWT_SECRET em Uint8Array para o jose */
const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || '');

export const AuthService = {
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

    const hash = process.env.AUTH_PASSWORD_HASH;
    if (!hash) {
      throw new AppError('Configuração de autenticação ausente.', 500);
    }

    const senhaValida = await bcrypt.compare(senha, hash);
    if (!senhaValida) {
      throw new AppError('Senha incorreta.', 401);
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const username  = process.env.AUTH_USER || 'admin';

    const token = await new SignJWT({ authenticated: true, username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(getSecret());

    return { token, expiresIn, username };
  },
};
