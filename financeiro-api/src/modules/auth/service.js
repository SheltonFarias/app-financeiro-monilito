import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export class AuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Mantém claims, algoritmo e defaults compatíveis com a autenticação atual do
 * monólito para que sessões emitidas pela nova API possam ser validadas pelos
 * dois lados durante o corte gradual.
 */
export async function login(senha, authConfig) {
  if (!senha) throw new AuthError('Senha não informada.', 401);
  if (!authConfig.passwordHash) throw new AuthError('Configuração de autenticação ausente.', 500);
  if (!authConfig.jwtSecret) throw new AuthError('Configuração de autenticação ausente.', 500);

  const senhaValida = await bcrypt.compare(senha, authConfig.passwordHash);
  if (!senhaValida) throw new AuthError('Senha incorreta.', 401);

  const token = await new SignJWT({ authenticated: true, username: authConfig.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(authConfig.jwtExpiresIn)
    .sign(new TextEncoder().encode(authConfig.jwtSecret));

  return { token, expiresIn: authConfig.jwtExpiresIn, username: authConfig.username };
}
