import { NextResponse } from 'next/server';
import { RelatoriosService } from '@/backend/modules/relatorios/relatorios.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const tipo = searchParams.get('tipo');

    if (!mes) {
      return NextResponse.json({ error: 'Parâmetro mes é obrigatório' }, { status: 400 });
    }

    if (tipo === 'projecao') {
      const projecao = RelatoriosService.gerarProjecao(mes);
      return NextResponse.json(projecao);
    } else if (tipo === 'categoria') {
      const categorias = RelatoriosService.agruparPorCategoria(mes);
      return NextResponse.json(categorias);
    } else {
      // Retorna os dois se não especificar
      const projecao = RelatoriosService.gerarProjecao(mes);
      const categorias = RelatoriosService.agruparPorCategoria(mes);
      return NextResponse.json({ projecao, categorias });
    }

  } catch (error) {
    console.error('Erro GET /api/relatorios:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status });
  }
}
