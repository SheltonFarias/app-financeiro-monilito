import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { JWT_SECRET } from '../config/env';

export function withAuth(handler) {
  return async (req, ctx) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Token de autenticação não fornecido.' }, { status: 401 });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Em Next.js Route Handlers req é um wrapper, mas ainda podemos injetar propriedades se for o mesmo objeto passado
      } catch {
        return NextResponse.json({ success: false, error: 'Token inválido ou expirado.' }, { status: 401 });
      }

      // Chama o handler original
      return await handler(req, ctx);
    } catch (err) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status || 500 });
    }
  };
}
