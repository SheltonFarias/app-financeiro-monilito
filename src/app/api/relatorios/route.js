import { NextResponse } from 'next/server';
import { RelatoriosService } from '@/backend/modules/relatorios/relatorios.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const mes  = searchParams.get('mes');
    const tipo = searchParams.get('tipo');
    const mes1 = searchParams.get('mes1');
    const mes2 = searchParams.get('mes2');

    if (tipo === 'projecao') {
      if (!mes) return NextResponse.json({ success: false, error: 'Parâmetro mes é obrigatório' }, { status: 400 });
      const data = RelatoriosService.gerarProjecao(mes, 11);
      return NextResponse.json({ success: true, data });

    } else if (tipo === 'categoria') {
      if (!mes) return NextResponse.json({ success: false, error: 'Parâmetro mes é obrigatório' }, { status: 400 });
      const data = RelatoriosService.agruparPorCategoria(mes);
      return NextResponse.json({ success: true, data });

    } else if (tipo === 'historico') {
      const data = RelatoriosService.historicoConsolidado();
      return NextResponse.json({ success: true, data });

    } else if (tipo === 'comparacao') {
      if (!mes1 || !mes2) {
        return NextResponse.json({ success: false, error: 'Parâmetros mes1 e mes2 são obrigatórios' }, { status: 400 });
      }
      const data = RelatoriosService.compararMeses(mes1, mes2);
      return NextResponse.json({ success: true, data });

    } else {
      // Sem tipo: retorna projecao + categorias + historico juntos (usado pelo componente Relatorios.jsx)
      if (!mes) return NextResponse.json({ success: false, error: 'Parâmetro mes é obrigatório' }, { status: 400 });

      const projecao   = RelatoriosService.gerarProjecao(mes, 11);
      const categorias = RelatoriosService.agruparPorCategoria(mes);
      const historico  = RelatoriosService.historicoConsolidado();
      return NextResponse.json({ success: true, data: { projecao, categorias, historico } });
    }

  } catch (error) {
    console.error('Erro GET /api/relatorios:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: error.status || 500 }
    );
  }
});
