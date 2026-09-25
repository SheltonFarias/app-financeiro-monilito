/**
 * src/app/api/investimentos/cotacoes/historico/route.js
 *
 * Retorna a série histórica de cotações de um ativo armazenada no banco.
 * Dados são persistidos a cada busca da Brapi e mantidos por 90 dias.
 *
 * GET /api/investimentos/cotacoes/historico?symbol=PETR4&limit=30
 * → { symbol, historico: [{ preco, var_dia, cotacao_em, salvo_em }] }
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';

const TICKER_REGEX = /^[A-Z]{4,6}[0-9]{0,2}$/;

function getRepo() {
  return require('@/backend/modules/cotacoes/cotacoes.repository');
}

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = (searchParams.get('symbol') ?? '').toUpperCase().trim();
    const limit  = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '90', 10)));

    if (!TICKER_REGEX.test(symbol)) {
      return NextResponse.json(
        { success: false, error: 'Ticker inválido.' },
        { status: 400 }
      );
    }

    const repo     = getRepo();
    const historico = repo.getHistoricoPorAtivo(symbol, limit);

    return NextResponse.json({
      success: true,
      data: { symbol, historico },
    });
  } catch (error) {
    console.error('[cotacoes/historico] Erro:', error.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar histórico.' },
      { status: 500 }
    );
  }
});
