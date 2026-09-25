import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

/** Converte o JWT_SECRET em Uint8Array — obrigatório para o jose */
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export function withAuth(handler) {
  return async (req, ctx) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Token de autenticação não fornecido.' },
          { status: 401 }
        );
      }

      const token = authHeader.split(' ')[1];
      try {
        const { payload } = await jwtVerify(token, secret);
        req.user = payload;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Token inválido ou expirado.' },
          { status: 401 }
        );
      }

      // Chama o handler original
      return await handler(req, ctx);
    } catch (err) {
      console.error('[withAuth] Erro não tratado no handler:', err);
      return NextResponse.json(
        { success: false, error: err.message || 'Erro interno do servidor.' },
        { status: err.status || 500 }
      );
    }
  };
}
