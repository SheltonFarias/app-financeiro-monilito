/**
 * src/app/api/investimentos/cotacoes/stats/route.js
 *
 * Retorna o estado atual do consumo mensal de requisições à Brapi.
 * Permite que o frontend exiba o indicador de rate-limit sem precisar
 * aguardar uma busca de cotações.
 *
 * GET /api/investimentos/cotacoes/stats
 * → { requisicoesMes, limiteMaximo, mesAno, percentual, limiteMensalAtingido }
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';

function getRepo() {
  return require('@/backend/modules/cotacoes/cotacoes.repository');
}

export const GET = withAuth(async () => {
  try {
    const repo     = getRepo();
    const controle = repo.getControleRequisicoes();
    const percentual = Math.min(100, (controle.total / repo.LIMITE_MENSAL) * 100);

    return NextResponse.json({
      success: true,
      data: {
        requisicoesMes:       controle.total,
        limiteMaximo:         repo.LIMITE_MENSAL,
        mesAno:               controle.mesAno,
        percentual:           parseFloat(percentual.toFixed(2)),
        limiteMensalAtingido: controle.limiteAtingido,
      },
    });
  } catch (error) {
    console.error('[cotacoes/stats] Erro:', error.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas.' },
      { status: 500 }
    );
  }
});
