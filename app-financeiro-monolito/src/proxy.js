import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

/** jose exige Uint8Array — compatível com Edge Runtime (sem Node.js crypto) */
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * proxy.js — Substitui o antigo middleware.js (renomeado no Next.js 16).
 * Protege rotas da API exigindo JWT no header Authorization.
 */
export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protege rotas da API, exceto endpoints que possuem autenticação própria.
  // O webhook do Telegram valida X-Telegram-Bot-Api-Secret-Token na própria rota.
  if (
    pathname.startsWith('/api') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/api/bot/webhook')
  ) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
