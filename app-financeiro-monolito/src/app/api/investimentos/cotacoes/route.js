/**
 * src/app/api/investimentos/cotacoes/route.js
 *
 * Proxy server-side para cotações de ativos (Brapi) e taxa CDI (Banco Central do Brasil).
 *
 * SEGURANÇA:
 *  - A BRAPI_TOKEN nunca trafega ao browser — lida exclusivamente no servidor via process.env.
 *  - Tickers são validados com regex whitelist antes de qualquer fetch externo (previne SSRF).
 *  - Cache persistente em SQLite de 15 min reduz o consumo das 15.000 req/mês gratuitas da Brapi.
 *  - Rota protegida por withAuth — apenas usuários autenticados podem chamá-la.
 *  - Falhas externas retornam dados parciais (fallback do banco), nunca derrubam a aplicação.
 *
 * FONTES:
 *  - Brapi (brapi.dev) — cotações de Ações, FIIs, ETFs (plano gratuito, delay ~30 min)
 *  - Banco Central do Brasil SGS — CDI diário (série 12), sem autenticação, gratuito
 *
 * LÓGICA DE RATE-LIMIT:
 *  1. Verifica controle_requisicoes — se mês mudou, auto-reset.
 *  2. Se total >= 15.000 → serve dados do SQLite (fallback), sinaliza limiteMensalAtingido.
 *  3. Para cada ticker: busca SQLite (TTL 15 min) antes de chamar a Brapi.
 *  4. Tickers sem cache válido → Brapi → salva em cotacoes + historico_cotacoes.
 *  5. Cada chamada HTTP à Brapi incrementa o contador em 1 (independente de quantos tickers).
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';

// Repository é CJS — importado via require embutido para compatibilidade com Next.js Edge/Node
function getRepo() {
  return require('@/backend/modules/cotacoes/cotacoes.repository');
}

// ── Cache in-memory para CDI (sem relação com o limite Brapi) ─────────────────
const CACHE_TTL_CDI_MS = 10 * 60 * 1000; // 10 minutos
let cdiCache = null; // { valor, ts }

// ── TTL do cache de cotações no banco ────────────────────────────────────────
const CACHE_TTL_COTACOES_MIN = 15; // minutos

// ── Validação de tickers (whitelist de formato) ────────────────────────────────
/**
 * Aceita apenas tickers no padrão B3: 4–6 letras seguidas de dígitos opcionais.
 * Ex: PETR4, HGLG11, BOVA11 — rejeita qualquer outro input (previne SSRF).
 */
const TICKER_REGEX = /^[A-Z]{4,6}[0-9]{0,2}$/;

function sanitizeTickers(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .toUpperCase()
    .split(',')
    .map((t) => t.trim())
    .filter((t) => TICKER_REGEX.test(t))
    .slice(0, 30); // limite máximo de 30 tickers por chamada
}

// ── Busca CDI diário no Banco Central (sem autenticação) ─────────────────────
async function fetchCDI() {
  if (cdiCache && Date.now() - cdiCache.ts < CACHE_TTL_CDI_MS) return cdiCache.valor;

  try {
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
      { next: { revalidate: 600 } }
    );
    if (!res.ok) throw new Error(`BCB respondeu ${res.status}`);
    const json = await res.json();
    const valor = parseFloat(json?.[0]?.valor ?? '0');
    cdiCache = { valor, ts: Date.now() };
    return valor;
  } catch {
    return cdiCache?.valor ?? 0;
  }
}

// ── Busca cotações na Brapi para os tickers que não estão em cache ─────────────
/**
 * @param {string[]} tickers — lista já sanitizada de tickers sem cache válido
 * @returns {Record<string, object>} — mapa symbol → dados da cotação
 */
async function fetchCotacoesBrapi(tickers) {
  const resultado = {};
  if (tickers.length === 0) return resultado;

  try {
    const tickersStr = tickers.join(',');
    const token = process.env.BRAPI_TOKEN;

    // Brapi v2: autenticação via header Bearer (token nunca exposto no client)
    const url = `https://brapi.dev/api/v2/stocks/quote?symbols=${tickersStr}&fundamental=false`;
    const headers = { 'User-Agent': 'app-financeiro/1.0' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Brapi respondeu ${res.status}`);

    const json = await res.json();
    const results = json?.stocks ?? json?.results ?? [];

    for (const item of results) {
      resultado[item.symbol] = {
        preco:      item.regularMarketPrice ?? null,
        varDia:     item.regularMarketChangePercent ?? null,
        volume:     item.regularMarketVolume ?? null,
        marketCap:  item.marketCap ?? null,
        nome:       item.longName ?? item.shortName ?? item.symbol ?? '',
        cotacaoEm:  item.regularMarketTime
          ? new Date(item.regularMarketTime * 1000).toISOString()
          : new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('[cotacoes] Erro ao buscar Brapi:', err.message);
  }

  return resultado;
}

// ── Handler principal ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req) => {
  try {
    const repo = getRepo();
    const { searchParams } = new URL(req.url);
    const rawTickers = searchParams.get('tickers') ?? '';
    const tickers = sanitizeTickers(rawTickers);

    // 1. Verificar estado do rate-limit mensal
    const controle = repo.getControleRequisicoes();

    // 2. Se limite atingido → servir apenas dados do banco (fallback)
    if (controle.limiteAtingido) {
      const cotacoesFallback = {};
      let dadosDesatualizados = false;

      for (const ticker of tickers) {
        const row = repo.getCotacaoFallback(ticker);
        if (row) {
          cotacoesFallback[ticker] = { preco: row.preco, varDia: row.var_dia, nome: row.nome };
          dadosDesatualizados = true;
        }
      }

      const cdiDiario = await fetchCDI();
      const cdiAnual  = parseFloat((Math.pow(1 + cdiDiario / 100, 252) - 1).toFixed(4)) * 100;

      return NextResponse.json({
        success: true,
        data: {
          cotacoes:    cotacoesFallback,
          cdiDiario,
          cdiAnual,
          atualizadoEm: new Date().toISOString(),
        },
        meta: {
          requisicoesMes:      controle.total,
          limiteMaximo:        repo.LIMITE_MENSAL,
          limiteMensalAtingido: true,
          dadosDesatualizados,
          fonteDados:          'fallback_limite',
        },
      });
    }

    // 3. Separar tickers em: cache válido (banco) vs. precisam fetch (Brapi)
    const resultado   = {};
    const precisamFetch = [];
    let   fonteDados  = 'cache_db'; // otimista — muda para "api" se qualquer ticker precisar fetch

    for (const ticker of tickers) {
      const cached = repo.getCotacaoRecente(ticker, CACHE_TTL_COTACOES_MIN);
      if (cached) {
        resultado[ticker] = { preco: cached.preco, varDia: cached.var_dia, nome: cached.nome };
      } else {
        precisamFetch.push(ticker);
      }
    }

    // 4. Buscar na Brapi os tickers sem cache válido
    if (precisamFetch.length > 0) {
      fonteDados = 'api';
      const novos = await fetchCotacoesBrapi(precisamFetch);

      // Persiste cada novo resultado no banco
      for (const [symbol, dados] of Object.entries(novos)) {
        repo.upsertCotacao(symbol, dados);
        repo.salvarHistorico(symbol, dados);
        resultado[symbol] = { preco: dados.preco, varDia: dados.varDia, nome: dados.nome };
      }

      // Incrementa 1 requisição HTTP (independente de quantos tickers foram buscados)
      repo.incrementarRequisicoes(1);
    }

    // 5. Busca CDI em paralelo (não conta como requisição Brapi)
    const cdiDiario = await fetchCDI();
    const cdiAnual  = parseFloat((Math.pow(1 + cdiDiario / 100, 252) - 1).toFixed(4)) * 100;

    // 6. Estado atualizado do contador (após possível incremento)
    const controleAtualizado = repo.getControleRequisicoes();

    return NextResponse.json({
      success: true,
      data: {
        cotacoes:    resultado,
        cdiDiario,
        cdiAnual,
        atualizadoEm: new Date().toISOString(),
      },
      meta: {
        requisicoesMes:       controleAtualizado.total,
        limiteMaximo:         repo.LIMITE_MENSAL,
        limiteMensalAtingido: controleAtualizado.limiteAtingido,
        dadosDesatualizados:  false,
        fonteDados,
      },
    });
  } catch (error) {
    console.error('[cotacoes] Erro no handler:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar cotações.',
        data: { cotacoes: {}, cdiDiario: 0, cdiAnual: 0 },
        meta: { requisicoesMes: 0, limiteMaximo: 15000, limiteMensalAtingido: false, dadosDesatualizados: false, fonteDados: 'erro' },
      },
      { status: 500 }
    );
  }
});
