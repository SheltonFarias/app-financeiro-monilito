import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';

// Repository é CJS — importado via require dinâmico (mesmo padrão do cotacoes/route.js)
function getRepo() {
  return require('@/backend/modules/cotacoes/cotacoes.repository');
}

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const q      = searchParams.get('q');
  const ticker = searchParams.get('ticker');
  const token  = process.env.BRAPI_TOKEN;
  const repo   = getRepo();

  try {
    // Verifica rate-limit mensal (Prisma async)
    const controle = await repo.getControleRequisicoes();
    if (controle.limiteAtingido) {
      return NextResponse.json({ success: true, data: [] });
    }

    if (q) {
      // Busca lista de sugestões de tickers na Brapi
      const res = await fetch(
        `https://brapi.dev/api/quote/list?search=${encodeURIComponent(q)}&token=${token}`
      );
      await repo.incrementarRequisicoes(1);

      if (!res.ok) throw new Error(`Brapi respondeu com ${res.status}`);
      const json = await res.json();

      const results = (json.stocks || []).slice(0, 8).map(s => ({
        ticker: s.stock,
        nome:   s.name,
        preco:  s.close,
        setor:  s.sector,
      }));

      return NextResponse.json({ success: true, data: results });
    }

    if (ticker) {
      // Busca detalhes e dividendos de um ticker específico
      const res = await fetch(
        `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?fundamental=true&dividends=true&token=${token}`
      );
      await repo.incrementarRequisicoes(1);

      if (!res.ok) throw new Error(`Brapi respondeu com ${res.status}`);
      const json = await res.json();

      const r = json.results?.[0];
      if (!r) return NextResponse.json({ success: false, error: 'Ticker não encontrado' });

      // Soma dividendos pagos nos últimos 12 meses
      const cash = r.dividendsData?.cashDividends || [];
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const dividendoAnual = cash
        .filter(d => new Date(d.paymentDate || d.approvedOn) >= oneYearAgo)
        .reduce((acc, d) => acc + d.rate, 0);

      return NextResponse.json({
        success: true,
        data: { dividendoAnual: parseFloat(dividendoAnual.toFixed(4)) },
      });
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    console.error('[busca_brapi]', error.message);
    return NextResponse.json(
      { success: false, error: 'Falha na comunicação com Brapi' },
      { status: 500 }
    );
  }
});
