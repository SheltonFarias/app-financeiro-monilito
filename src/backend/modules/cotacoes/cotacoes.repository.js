/**
 * cotacoes.repository.js
 *
 * Camada de acesso ao banco de dados para o módulo de cotações Brapi.
 * Todas as operações são assíncronas (Prisma + PostgreSQL/Supabase).
 *
 * Responsabilidades:
 *  - Cache persistente de cotações (substitui o Map in-memory volátil)
 *  - Série histórica por ativo (com retenção automática de 90 dias)
 *  - Controle de rate-limit mensal (contador singleton com auto-reset)
 */

const { prisma } = require('../../config/database');

// ── Constantes ────────────────────────────────────────────────────────────────
const LIMITE_MENSAL       = 15_000;
const RETENCAO_HISTORICO  = 90; // dias

// ── Controle de Requisições (rate-limit tracker) ───────────────────────────────

/**
 * Retorna o estado atual do contador de requisições.
 * Se o mês mudou, reseta o contador automaticamente antes de retornar.
 *
 * @returns {Promise<{ mesAno: string, total: number, limiteAtingido: boolean }>}
 */
async function getControleRequisicoes() {
  const mesAtual = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const row = await prisma.controleRequisicao.findUnique({ where: { id: 1 } });

  // Auto-reset se o mês mudou ou registro não existe
  if (!row || row.mes_ano_referencia !== mesAtual) {
    await prisma.controleRequisicao.upsert({
      where:  { id: 1 },
      create: { id: 1, mes_ano_referencia: mesAtual, total_requisicoes: 0 },
      update: { mes_ano_referencia: mesAtual, total_requisicoes: 0 },
    });
    return { mesAno: mesAtual, total: 0, limiteAtingido: false };
  }

  return {
    mesAno:         row.mes_ano_referencia,
    total:          row.total_requisicoes,
    limiteAtingido: row.total_requisicoes >= LIMITE_MENSAL,
  };
}

/**
 * Incrementa o contador de requisições do mês corrente em `n` unidades.
 *
 * @param {number} [n=1]
 * @returns {Promise<{ total: number }>}
 */
async function incrementarRequisicoes(n = 1) {
  // Garante que o mês está correto (auto-reset se necessário)
  await getControleRequisicoes();

  const updated = await prisma.controleRequisicao.update({
    where: { id: 1 },
    data:  { total_requisicoes: { increment: n } },
  });

  return { total: updated.total_requisicoes };
}

// ── Cache de Cotações (snapshot mais recente) ─────────────────────────────────

/**
 * Busca a cotação de um ativo no banco se ainda estiver dentro da janela de validade.
 *
 * @param {string} symbol   — ticker do ativo (ex: "PETR4")
 * @param {number} ttlMin   — validade em minutos (padrão: 15)
 * @returns {Promise<object|null>}
 */
async function getCotacaoRecente(symbol, ttlMin = 15) {
  const limite = new Date(Date.now() - ttlMin * 60 * 1000);

  const row = await prisma.cotacao.findFirst({
    where: {
      symbol,
      salvo_em: { gte: limite },
    },
  });

  return row ?? null;
}

/**
 * Insere ou atualiza a cotação mais recente de um ativo.
 *
 * @param {string} symbol
 * @param {{ preco, varDia, volume, marketCap, nome, cotacaoEm }} dados
 */
async function upsertCotacao(symbol, dados) {
  const { preco, varDia, volume, marketCap, nome, cotacaoEm } = dados;

  const payload = {
    preco:      preco      ?? null,
    var_dia:    varDia     ?? null,
    volume:     volume     ?? null,
    market_cap: marketCap  ?? null,
    nome:       nome       ?? null,
    cotacao_em: cotacaoEm  ?? null,
    salvo_em:   new Date(),
  };

  await prisma.cotacao.upsert({
    where:  { symbol },
    create: { symbol, ...payload },
    update: payload,
  });
}

// ── Histórico de Cotações ──────────────────────────────────────────────────────

/**
 * Persiste um ponto histórico e remove registros com mais de 90 dias.
 *
 * @param {string} symbol
 * @param {{ preco, varDia, volume, marketCap, cotacaoEm }} dados
 */
async function salvarHistorico(symbol, dados) {
  const { preco, varDia, volume, marketCap, cotacaoEm } = dados;

  await prisma.historicoCotacao.create({
    data: {
      symbol,
      preco:      preco     ?? null,
      var_dia:    varDia    ?? null,
      volume:     volume    ?? null,
      market_cap: marketCap ?? null,
      cotacao_em: cotacaoEm ?? null,
      salvo_em:   new Date(),
    },
  });

  // Política de retenção: remove registros com mais de 90 dias
  const corte = new Date(Date.now() - RETENCAO_HISTORICO * 24 * 60 * 60 * 1000);
  await prisma.historicoCotacao.deleteMany({
    where: { symbol, salvo_em: { lt: corte } },
  });
}

/**
 * Retorna a série histórica de um ativo, da mais recente para a mais antiga.
 *
 * @param {string} symbol
 * @param {number} [limit=90]
 * @returns {Promise<Array>}
 */
async function getHistoricoPorAtivo(symbol, limit = 90) {
  return prisma.historicoCotacao.findMany({
    where:   { symbol },
    orderBy: { salvo_em: 'desc' },
    take:    limit,
  });
}

/**
 * Busca a cotação mais recente disponível (fallback quando limite mensal é atingido).
 *
 * @param {string} symbol
 * @returns {Promise<object|null>}
 */
async function getCotacaoFallback(symbol) {
  const row = await prisma.cotacao.findUnique({ where: { symbol } });
  return row ?? null;
}

module.exports = {
  LIMITE_MENSAL,
  getControleRequisicoes,
  incrementarRequisicoes,
  getCotacaoRecente,
  getCotacaoFallback,
  upsertCotacao,
  salvarHistorico,
  getHistoricoPorAtivo,
};

