/**
 * src/app/api/investimentos/cotacoes/route.js
 *
 * Proxy server-side para cotações de ativos (Brapi) e taxa CDI (Banco Central do Brasil).
 *
 * SEGURANÇA:
 *  - A BRAPI_TOKEN nunca trafega ao browser — lida exclusivamente no servidor via process.env.
 *  - Tickers são validados com regex whitelist antes de qualquer fetch externo (previne SSRF).
 *  - Cache in-memory de 10 minutos reduz o consumo das 15.000 req/mês gratuitas da Brapi.
 *  - Rota protegida por withAuth — apenas usuários autenticados podem chamá-la.
 *  - Falhas externas retornam dados parciais, nunca derrubam a aplicação.
 *
 * FONTES:
 *  - Brapi (brapi.dev) — cotações de Ações, FIIs, ETFs (plano gratuito, delay ~30 min)
 *  - Banco Central do Brasil SGS — CDI diário (série 12), sem autenticação, gratuito
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';

// ── Cache in-memory ────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const cotacoesCache = new Map(); // ticker → { preco, varDia, nome, ts }
let cdiCache = null;             // { valor, ts }

/** Retorna um item do cache se ainda estiver válido, ou null se expirado. */
function fromCache(map, key) {
  const item = map.get ? map.get(key) : map;
  if (!item) return null;
  if (Date.now() - item.ts > CACHE_TTL_MS) return null;
  return item;
}

// ── Validação de tickers (whitelist de formato) ────────────────────────────────
/**
 * Aceita apenas tickers no padrão B3: 4–6 letras seguidas de dígitos opcionais.
 * Ex: PETR4, HGLG11, BOVA11, TESOURO-SELIC — rejeita qualquer outro input.
 * Isso previne SSRF e injection na URL da Brapi.
 */
const TICKER_REGEX = /^[A-Z]{4,6}[0-9]{0,2}$/;

function sanitizeTickers(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .toUpperCase()
    .split(',')
    .map(t => t.trim())
    .filter(t => TICKER_REGEX.test(t))
    .slice(0, 30); // limite máximo de 30 tickers por chamada
}

// ── Busca CDI diário no Banco Central (sem autenticação) ───────────────────────
async function fetchCDI() {
  const cached = fromCache(null, null);
  if (cdiCache && Date.now() - cdiCache.ts < CACHE_TTL_MS) return cdiCache.valor;

  try {
    // Série 12 = CDI diário (taxa ao dia, em %)
    const res = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json',
      { next: { revalidate: 600 } } // cache Next.js de 10 min como redundância
    );
    if (!res.ok) throw new Error(`BCB respondeu ${res.status}`);
    const json = await res.json();
    const valor = parseFloat(json?.[0]?.valor ?? '0');
    cdiCache = { valor, ts: Date.now() };
    return valor;
  } catch {
    // Retorna último valor em cache mesmo que expirado, ou 0
    return cdiCache?.valor ?? 0;
  }
}

// ── Busca cotações na Brapi ────────────────────────────────────────────────────
async function fetchCotacoesBrapi(tickers) {
  const token = process.env.BRAPI_TOKEN;

  // Separa tickers que já estão em cache dos que precisam ser buscados
  const resultado = {};
  const precisamFetch = [];

  for (const ticker of tickers) {
    const cached = fromCache(cotacoesCache, ticker);
    if (cached) {
      resultado[ticker] = cached;
    } else {
      precisamFetch.push(ticker);
    }
  }

  if (precisamFetch.length === 0) return resultado;

  // Sem token configurado: retorna objeto vazio para os tickers sem cache
  if (!token) {
    console.warn('[cotacoes] BRAPI_TOKEN não configurado. Cotações indisponíveis.');
    return resultado;
  }

  try {
    const tickersStr = precisamFetch.join(',');
    const url = `https://brapi.dev/api/quote/${tickersStr}?token=${token}&fundamental=false`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'app-financeiro/1.0' },
    });

    if (!res.ok) throw new Error(`Brapi respondeu ${res.status}`);

    const json = await res.json();
    const results = json?.results ?? [];

    for (const item of results) {
      const entry = {
        preco:  item.regularMarketPrice ?? null,
        varDia: item.regularMarketChangePercent ?? null,
        nome:   item.longName ?? item.shortName ?? item.symbol ?? '',
        ts:     Date.now(),
      };
      cotacoesCache.set(item.symbol, entry);
      resultado[item.symbol] = entry;
    }
  } catch (err) {
    console.error('[cotacoes] Erro ao buscar Brapi:', err.message);
    // Não propaga o erro — retorna o que já foi coletado do cache
  }

  return resultado;
}

// ── Handler principal ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawTickers = searchParams.get('tickers') ?? '';

    const tickers = sanitizeTickers(rawTickers);

    // Busca em paralelo: cotações Brapi + CDI do Banco Central
    const [cotacoes, cdiDiario] = await Promise.all([
      fetchCotacoesBrapi(tickers),
      fetchCDI(),
    ]);

    // Remove o campo 'ts' (timestamp interno) antes de enviar ao cliente
    const cotacoesPublicas = {};
    for (const [ticker, dados] of Object.entries(cotacoes)) {
      const { ts: _ts, ...publico } = dados;
      cotacoesPublicas[ticker] = publico;
    }

    return NextResponse.json({
      success: true,
      data: {
        cotacoes: cotacoesPublicas,
        cdiDiario,              // % ao dia (ex: 0.0412)
        cdiAnual: parseFloat((Math.pow(1 + cdiDiario / 100, 252) - 1).toFixed(4)) * 100,
        atualizadoEm: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar cotações.', cotacoes: {}, cdiDiario: 0 },
      { status: 500 }
    );
  }
});
