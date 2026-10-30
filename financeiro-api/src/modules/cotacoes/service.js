const LIMITE_MENSAL = 15_000;
const TICKER = /^[A-Z]{4,6}[0-9]{0,2}$/;

const tickers = (raw) => String(raw ?? '').toUpperCase().split(',')
  .map((value) => value.trim())
  .filter((value) => TICKER.test(value))
  .slice(0, 30);

function calcularDividendoAnual(dividendos) {
  const inicio = new Date();
  inicio.setFullYear(inicio.getFullYear() - 1);

  const total = (dividendos ?? [])
    .filter((dividendo) => new Date(dividendo.paymentDate ?? dividendo.approvedOn) >= inicio)
    .reduce((acumulado, dividendo) => {
      const valor = Number(dividendo.rate ?? dividendo.value ?? dividendo.amount ?? 0);
      return acumulado + (Number.isFinite(valor) ? valor : 0);
    }, 0);

  return Number(total.toFixed(4));
}

export function createCotacoesService(prisma, { fetchImpl = fetch, brapiToken = process.env.BRAPI_TOKEN } = {}) {
  let cdiCache;

  const controle = async () => {
    const mes = new Date().toISOString().slice(0, 7);
    const atual = await prisma.controleRequisicao.findUnique({ where: { id: 1 } });
    if (!atual || atual.mes_ano_referencia !== mes) {
      await prisma.controleRequisicao.upsert({
        where: { id: 1 },
        create: { id: 1, mes_ano_referencia: mes, total_requisicoes: 0 },
        update: { mes_ano_referencia: mes, total_requisicoes: 0 },
      });
      return { mesAno: mes, total: 0, limiteAtingido: false };
    }
    return { mesAno: mes, total: atual.total_requisicoes, limiteAtingido: atual.total_requisicoes >= LIMITE_MENSAL };
  };

  const cdi = async () => {
    if (cdiCache && Date.now() - cdiCache.ts < 600_000) return cdiCache.valor;
    try {
      const resposta = await fetchImpl('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json');
      if (!resposta.ok) throw new Error();
      const valor = Number.parseFloat((await resposta.json())?.[0]?.valor ?? '0');
      cdiCache = { valor, ts: Date.now() };
      return valor;
    } catch {
      return cdiCache?.valor ?? 0;
    }
  };

  const salvar = async (symbol, dado) => {
    const data = {
      preco: dado.preco ?? null, var_dia: dado.varDia ?? null, volume: dado.volume ?? null,
      market_cap: dado.marketCap ?? null, nome: dado.nome ?? null, cotacao_em: dado.cotacaoEm ?? null,
    };
    await prisma.cotacao.upsert({ where: { symbol }, create: { symbol, ...data }, update: { ...data, salvo_em: new Date() } });
    await prisma.historicoCotacao.create({ data: { symbol, ...data } });
    await prisma.historicoCotacao.deleteMany({ where: { symbol, salvo_em: { lt: new Date(Date.now() - 90 * 86_400_000) } } });
  };

  const buscarBrapi = async (symbols) => {
    if (!symbols.length) return {};
    const headers = { 'User-Agent': 'app-financeiro/1.0' };
    if (brapiToken) headers.Authorization = `Bearer ${brapiToken}`;
    const resposta = await fetchImpl(`https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(symbols.join(','))}&fundamental=false`, { headers });
    if (!resposta.ok) throw new Error(`Brapi respondeu ${resposta.status}`);
    const resultado = {};
    for (const item of (await resposta.json()).stocks ?? []) {
      resultado[item.symbol] = {
        preco: item.regularMarketPrice ?? null, varDia: item.regularMarketChangePercent ?? null,
        volume: item.regularMarketVolume ?? null, marketCap: item.marketCap ?? null,
        nome: item.longName ?? item.shortName ?? item.symbol,
        cotacaoEm: item.regularMarketTime ? new Date(item.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
      };
    }
    return resultado;
  };

  const buscarDividendoYahoo = async (ticker) => {
    const symbol = `${String(ticker).toUpperCase()}.SA`;
    const resposta = await fetchImpl(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=div%2Csplits`,
    );
    if (!resposta.ok) throw new Error(`Yahoo Finance respondeu ${resposta.status}`);
    const dados = (await resposta.json()).chart?.result?.[0];
    const dividendos = Object.values(dados?.events?.dividends ?? {}).map((dividendo) => ({
      paymentDate: new Date(dividendo.date * 1000).toISOString(),
      rate: dividendo.amount,
    }));
    return calcularDividendoAnual(dividendos);
  };

  return {
    async cotacoes(raw) {
      const symbols = tickers(raw);
      const antes = await controle();
      const cotacoes = {};
      const faltantes = [];
      let fonte = 'cache_db';
      let desatualizados = false;

      for (const symbol of symbols) {
        const row = await prisma.cotacao.findFirst({ where: { symbol, salvo_em: { gte: new Date(Date.now() - 900_000) } } });
        if (row) cotacoes[symbol] = { preco: row.preco, varDia: row.var_dia, nome: row.nome };
        else faltantes.push(symbol);
      }

      if (faltantes.length && !antes.limiteAtingido) {
        fonte = 'api';
        try {
          for (const [symbol, dado] of Object.entries(await buscarBrapi(faltantes))) {
            await salvar(symbol, dado);
            cotacoes[symbol] = { preco: dado.preco, varDia: dado.varDia, nome: dado.nome };
          }
          await prisma.controleRequisicao.update({ where: { id: 1 }, data: { total_requisicoes: { increment: 1 } } });
        } catch {
          fonte = 'fallback';
          desatualizados = true;
        }
      } else if (faltantes.length) {
        fonte = 'fallback_limite';
        desatualizados = true;
      }

      if (desatualizados) {
        for (const symbol of faltantes) {
          const row = await prisma.cotacao.findUnique({ where: { symbol } });
          if (row) cotacoes[symbol] = { preco: row.preco, varDia: row.var_dia, nome: row.nome };
        }
      }

      const diario = await cdi();
      const atual = await controle();
      return {
        data: { cotacoes, cdiDiario: diario, cdiAnual: Number(((1 + diario / 100) ** 252 - 1).toFixed(4)) * 100, atualizadoEm: new Date().toISOString() },
        meta: { requisicoesMes: atual.total, limiteMaximo: LIMITE_MENSAL, limiteMensalAtingido: atual.limiteAtingido, dadosDesatualizados: desatualizados, fonteDados: fonte },
      };
    },

    async historico(symbol, limit = 90) {
      const ticker = String(symbol ?? '').toUpperCase();
      if (!TICKER.test(ticker)) throw Object.assign(new Error('Ticker inválido.'), { statusCode: 400 });
      const take = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 90));
      return { symbol: ticker, historico: await prisma.historicoCotacao.findMany({ where: { symbol: ticker }, orderBy: { salvo_em: 'desc' }, take }) };
    },

    async stats() {
      const atual = await controle();
      return { requisicoesMes: atual.total, limiteMaximo: LIMITE_MENSAL, mesAno: atual.mesAno, percentual: Number(Math.min(100, atual.total / LIMITE_MENSAL * 100).toFixed(2)), limiteMensalAtingido: atual.limiteAtingido };
    },

    async busca({ q, ticker }) {
      const atual = await controle();
      if (atual.limiteAtingido) return [];
      if (q) {
        const resposta = await fetchImpl(`https://brapi.dev/api/quote/list?search=${encodeURIComponent(q)}${brapiToken ? `&token=${encodeURIComponent(brapiToken)}` : ''}`);
        if (!resposta.ok) throw new Error(`Brapi respondeu ${resposta.status}`);
        await prisma.controleRequisicao.update({ where: { id: 1 }, data: { total_requisicoes: { increment: 1 } } });
        return ((await resposta.json()).stocks ?? []).slice(0, 8).map((item) => ({ ticker: item.stock, nome: item.name, preco: item.close, setor: item.sector }));
      }
      if (ticker && TICKER.test(String(ticker).toUpperCase())) {
        try {
          const resposta = await fetchImpl(`https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?fundamental=true&dividends=true${brapiToken ? `&token=${encodeURIComponent(brapiToken)}` : ''}`);
          if (!resposta.ok) throw new Error(`Brapi respondeu ${resposta.status}`);
          await prisma.controleRequisicao.update({ where: { id: 1 }, data: { total_requisicoes: { increment: 1 } } });
          const dados = (await resposta.json()).results?.[0];
          if (dados) return { dividendoAnual: calcularDividendoAnual(dados.dividendsData?.cashDividends), fonte: 'brapi' };
        } catch {
          // A Brapi pode recusar tokens expirados ou atingir limites de plano.
          // O Yahoo Finance mantém o formulário funcional nesses casos.
        }
        return { dividendoAnual: await buscarDividendoYahoo(ticker), fonte: 'yahoo_finance' };
      }
      return [];
    },
  };
}
