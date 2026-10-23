import { jwtVerify } from 'jose';
import { AuthError } from './service.js';

/** Valida o mesmo header Bearer usado pelos Route Handlers do monólito. */
export async function authorize(headers, authConfig) {
  const authorization = headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthError('Token não fornecido.', 401);
  }

  try {
    const token = authorization.slice('Bearer '.length);
    const { payload } = await jwtVerify(token, new TextEncoder().encode(authConfig.jwtSecret));
    return payload;
  } catch {
    throw new AuthError('Token inválido ou expirado.', 401);
  }
}
