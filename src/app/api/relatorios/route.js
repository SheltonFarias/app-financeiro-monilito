import { NextResponse } from 'next/server';
import { RelatoriosService } from '@/backend/modules/relatorios/relatorios.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes  = searchParams.get('mes');
    const tipo = searchParams.get('tipo');
    const mes1 = searchParams.get('mes1');
    const mes2 = searchParams.get('mes2');

    if (tipo === 'projecao') {
      if (!mes) return NextResponse.json({ error: 'Parâmetro mes é obrigatório' }, { status: 400 });
      const projecao = RelatoriosService.gerarProjecao(mes, 11); // 12 meses total
      return NextResponse.json(projecao);

    } else if (tipo === 'categoria') {
      if (!mes) return NextResponse.json({ error: 'Parâmetro mes é obrigatório' }, { status: 400 });
      const categorias = RelatoriosService.agruparPorCategoria(mes);
      return NextResponse.json(categorias);

    } else if (tipo === 'historico') {
      const historico = RelatoriosService.historicoConsolidado();
      return NextResponse.json(historico);

    } else if (tipo === 'comparacao') {
      if (!mes1 || !mes2) {
        return NextResponse.json({ error: 'Parâmetros mes1 e mes2 são obrigatórios' }, { status: 400 });
      }
      const comparacao = RelatoriosService.compararMeses(mes1, mes2);
      return NextResponse.json(comparacao);

    } else {
      // Sem tipo: retorna projecao + categorias + historico juntos
      if (!mes) return NextResponse.json({ error: 'Parâmetro mes é obrigatório' }, { status: 400 });

      const projecao   = RelatoriosService.gerarProjecao(mes, 11);
      const categorias = RelatoriosService.agruparPorCategoria(mes);
      const historico  = RelatoriosService.historicoConsolidado();
      return NextResponse.json({ projecao, categorias, historico });
    }

  } catch (error) {
    console.error('Erro GET /api/relatorios:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status });
  }
}
