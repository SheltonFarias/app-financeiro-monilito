import { NextResponse } from 'next/server';
import { DashboardService } from '@/backend/modules/dashboard/dashboard.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const formato = searchParams.get('formato'); // atualmente apenas 'csv' é suportado aqui

    if (!mes) {
      return NextResponse.json({ error: 'Parâmetro mes é obrigatório' }, { status: 400 });
    }

    if (formato !== 'csv') {
      return NextResponse.json({ error: 'Formato não suportado ou não informado' }, { status: 400 });
    }

    const { gastosFixos, gastosVariaveis, receitas } = await DashboardService.carregarDados(mes);

    // Constrói as linhas do CSV
    const rows = [
      ['Tipo de Lançamento', 'Categoria', 'Descrição', 'Valor (R$)', 'Situação', 'Data/Vencimento', 'Extra']
    ];

    gastosVariaveis.forEach(g => {
      rows.push([
        'Gasto Variável',
        g.categoria || '',
        g.descricao || '',
        g.valor.toFixed(2),
        g.situacao || '',
        g.data_compra || g.mes,
        `Pagamento: ${g.pagamento || ''}`
      ]);
    });

    gastosFixos.forEach(g => {
      rows.push([
        'Gasto Fixo',
        g.categoria || '',
        g.descricao || '',
        g.valor.toFixed(2),
        g.situacao || '',
        g.vencimento || g.mes,
        `Cartão: ${g.cartao || ''}`
      ]);
    });

    receitas.forEach(r => {
      rows.push([
        'Receita',
        r.categoria || '',
        r.descricao || '',
        r.valor.toFixed(2),
        r.situacao || '',
        r.mes,
        ''
      ]);
    });

    // Função auxiliar para escapar valores no CSV
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      // Se contiver vírgula ou aspas, precisa ser envolvido em aspas
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str}"`;
      }
      return str;
    };

    const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\n');

    // Retorna a resposta com cabeçalhos para forçar o download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio_${mes}.csv"`,
      },
    });

  } catch (error) {
    console.error('Erro GET /api/exportar:', error);
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status });
  }
}
