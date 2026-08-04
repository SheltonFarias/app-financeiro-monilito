/**
 * cotacoes.repository.js
 *
 * Camada de acesso ao banco de dados para o módulo de cotações Brapi.
 * Todas as operações são síncronas (better-sqlite3).
 *
 * Responsabilidades:
 *  - Cache persistente de cotações (substitui o Map in-memory volátil)
 *  - Série histórica por ativo (com retenção automática de 90 dias)
 *  - Controle de rate-limit mensal (contador singleton com auto-reset)
 */

const { db } = require('../../config/database');

// ── Constantes ────────────────────────────────────────────────────────────────
const LIMITE_MENSAL       = 15_000;
const RETENCAO_HISTORICO  = 90; // dias

// ── Controle de Requisições (rate-limit tracker) ───────────────────────────────

/**
 * Retorna o estado atual do contador de requisições.
 * Se o mês mudou, reseta o contador automaticamente antes de retornar.
 *
 * @returns {{ mesAno: string, total: number, limiteAtingido: boolean }}
 */
function getControleRequisicoes() {
  const mesAtual = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const row = db
    .prepare('SELECT mes_ano_referencia, total_requisicoes FROM controle_requisicoes WHERE id = 1')
    .get();

  // Auto-reset se o mês mudou
  if (!row || row.mes_ano_referencia !== mesAtual) {
    db.prepare(`
      UPDATE controle_requisicoes
      SET mes_ano_referencia = ?, total_requisicoes = 0, atualizado_em = datetime('now')
      WHERE id = 1
    `).run(mesAtual);

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
 * Verifica e aplica o reset automático se necessário antes de incrementar.
 *
 * @param {number} [n=1] — número de requisições HTTP realizadas (1 chamada pode cobrir múltiplos tickers)
 * @returns {{ total: number }} — novo total após incremento
 */
function incrementarRequisicoes(n = 1) {
  // Garante que o mês está correto (auto-reset se necessário)
  getControleRequisicoes();

  db.prepare(`
    UPDATE controle_requisicoes
    SET total_requisicoes = total_requisicoes + ?, atualizado_em = datetime('now')
    WHERE id = 1
  `).run(n);

  const updated = db
    .prepare('SELECT total_requisicoes FROM controle_requisicoes WHERE id = 1')
    .get();

  return { total: updated.total_requisicoes };
}

// ── Cache de Cotações (snapshot mais recente) ─────────────────────────────────

/**
 * Busca a cotação de um ativo no banco se ainda estiver dentro da janela de validade.
 *
 * @param {string} symbol   — ticker do ativo (ex: "PETR4")
 * @param {number} ttlMin   — validade em minutos (padrão: 15)
 * @returns {object|null}   — dados da cotação ou null se expirada/inexistente
 */
function getCotacaoRecente(symbol, ttlMin = 15) {
  const row = db.prepare(`
    SELECT symbol, preco, var_dia, volume, market_cap, nome, cotacao_em, salvo_em
    FROM cotacoes
    WHERE symbol = ?
      AND salvo_em >= datetime('now', ? || ' minutes')
  `).get(symbol, `-${ttlMin}`);

  return row ?? null;
}

/**
 * Insere ou atualiza a cotação mais recente de um ativo.
 * Também aciona a limpeza do histórico antigo (>90 dias) para o mesmo ativo.
 *
 * @param {string} symbol
 * @param {{ preco, varDia, volume, marketCap, nome, cotacaoEm }} dados
 */
function upsertCotacao(symbol, dados) {
  const { preco, varDia, volume, marketCap, nome, cotacaoEm } = dados;

  db.prepare(`
    INSERT INTO cotacoes (symbol, preco, var_dia, volume, market_cap, nome, cotacao_em, salvo_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(symbol) DO UPDATE SET
      preco      = excluded.preco,
      var_dia    = excluded.var_dia,
      volume     = excluded.volume,
      market_cap = excluded.market_cap,
      nome       = excluded.nome,
      cotacao_em = excluded.cotacao_em,
      salvo_em   = excluded.salvo_em
  `).run(symbol, preco ?? null, varDia ?? null, volume ?? null, marketCap ?? null, nome ?? null, cotacaoEm ?? null);
}

// ── Histórico de Cotações ──────────────────────────────────────────────────────

/**
 * Persiste um ponto histórico para o ativo e remove registros com mais de 90 dias.
 *
 * @param {string} symbol
 * @param {{ preco, varDia, volume, marketCap, cotacaoEm }} dados
 */
function salvarHistorico(symbol, dados) {
  const { preco, varDia, volume, marketCap, cotacaoEm } = dados;

  db.prepare(`
    INSERT INTO historico_cotacoes (symbol, preco, var_dia, volume, market_cap, cotacao_em, salvo_em)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(symbol, preco ?? null, varDia ?? null, volume ?? null, marketCap ?? null, cotacaoEm ?? null);

  // Política de retenção: 90 dias
  db.prepare(`
    DELETE FROM historico_cotacoes
    WHERE symbol = ? AND salvo_em < datetime('now', '-${RETENCAO_HISTORICO} days')
  `).run(symbol);
}

/**
 * Retorna a série histórica de um ativo, da mais recente para a mais antiga.
 *
 * @param {string} symbol
 * @param {number} [limit=90] — número máximo de registros
 * @returns {Array<{ symbol, preco, var_dia, volume, market_cap, cotacao_em, salvo_em }>}
 */
function getHistoricoPorAtivo(symbol, limit = 90) {
  return db.prepare(`
    SELECT symbol, preco, var_dia, volume, market_cap, cotacao_em, salvo_em
    FROM historico_cotacoes
    WHERE symbol = ?
    ORDER BY salvo_em DESC
    LIMIT ?
  `).all(symbol, limit);
}

/**
 * Busca a cotação mais recente disponível no banco para um ativo,
 * independente do TTL (usado como fallback quando o limite mensal é atingido).
 *
 * @param {string} symbol
 * @returns {object|null}
 */
function getCotacaoFallback(symbol) {
  return db.prepare(`
    SELECT symbol, preco, var_dia, volume, market_cap, nome, cotacao_em, salvo_em
    FROM cotacoes
    WHERE symbol = ?
  `).get(symbol) ?? null;
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
