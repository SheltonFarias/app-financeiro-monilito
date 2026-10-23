import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './config.js';
import { AuthError, login } from './modules/auth/service.js';
import { createPrismaClient } from './database/client.js';
import { createPrismaDashboardService } from './modules/dashboard/prisma-adapter.js';
import { getDashboard, getDashboardHistory } from './modules/dashboard/controller.js';
import { createConfiguracoesService } from './modules/configuracoes/service.js';
import { getConfiguracoes, putConfiguracoes } from './modules/configuracoes/controller.js';
import { createRelatoriosService } from './modules/relatorios/service.js';
import { getRelatorios } from './modules/relatorios/controller.js';
import { createCartoesService } from './modules/cartoes/service.js';
import { getCartoes, postCartoes, putCartao, deleteCartao } from './modules/cartoes/controller.js';
import { createOrcamentosService } from './modules/orcamentos/service.js';
import { getOrcamentos, postOrcamentos, putOrcamento, deleteOrcamento } from './modules/orcamentos/controller.js';
import { createMetasService } from './modules/metas/service.js';
import { getMetas, postMetas, putMeta, deleteMeta, postAtivarMeta, deleteAtivarMeta } from './modules/metas/controller.js';
import { createLancamentosService } from './modules/lancamentos/service.js';
import { createLancamentosController } from './modules/lancamentos/controller.js';
import { createInvestimentosService } from './modules/investimentos/service.js';
import { getInvestimentos, postInvestimentos, putInvestimento, deleteInvestimento } from './modules/investimentos/controller.js';
import { createFinanciamentosService } from './modules/financiamentos/service.js';
import { executarFinanciamento } from './modules/financiamentos/controller.js';
import { createCotacoesService } from './modules/cotacoes/service.js';
import { cotacaoController } from './modules/cotacoes/controller.js';
import { createExportacaoService } from './modules/exportacao/service.js';
import { createBotService } from './modules/bot/service.js';

const HOP_BY_HOP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
]);

function writeJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...extraHeaders });
  response.end(JSON.stringify(body));
}

function applyCors(request, response, config) {
  const origin = request.headers.origin;
  if (!origin) return;
  if (config.corsOrigins.has(origin)) {
    response.setHeader('access-control-allow-origin', origin);
    response.setHeader('vary', 'Origin');
    response.setHeader('access-control-allow-headers', 'Authorization, Content-Type');
    response.setHeader('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

function forwardHeaders(headers) {
  const forwarded = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
      forwarded.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
  }
  return forwarded;
}

export function createServer(config = loadConfig(), fetchImpl = fetch, services = {}) {
  const prisma = services.prisma ?? (config.databaseUrl ? createPrismaClient(config.databaseUrl) : null);
  const dashboardService = services.dashboardService ?? (prisma
    ? createPrismaDashboardService(prisma)
    : null);
  const configuracoesService = services.configuracoesService ?? (prisma
    ? createConfiguracoesService(prisma)
    : null);
  const relatoriosService = services.relatoriosService ?? (prisma ? createRelatoriosService(prisma) : null);
  const cartoesService = services.cartoesService ?? (prisma ? createCartoesService(prisma) : null);
  const orcamentosService = services.orcamentosService ?? (prisma ? createOrcamentosService(prisma) : null);
  const metasService = services.metasService ?? (prisma ? createMetasService(prisma) : null);
  const gastosFixosController = services.gastosFixosController ?? (prisma ? createLancamentosController({ auth: config.auth, impl: createLancamentosService(prisma, 'fixo') }) : null);
  const gastosVariaveisController = services.gastosVariaveisController ?? (prisma ? createLancamentosController({ auth: config.auth, impl: createLancamentosService(prisma, 'variavel') }) : null);
  const receitasController = services.receitasController ?? (prisma ? createLancamentosController({ auth: config.auth, impl: createLancamentosService(prisma, 'receita') }) : null);
  const investimentosService = services.investimentosService ?? (prisma ? createInvestimentosService(prisma) : null);
  const financiamentosService = services.financiamentosService ?? (prisma ? createFinanciamentosService(prisma, fetchImpl) : null);
  const cotacoesService = services.cotacoesService ?? (prisma ? createCotacoesService(prisma, { fetchImpl }) : null);
  const exportacaoService = services.exportacaoService ?? (prisma ? createExportacaoService(prisma) : null);
  const botService = services.botService ?? (prisma ? createBotService(prisma, { token: process.env.TELEGRAM_BOT_TOKEN, webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET, allowedChatId: process.env.TELEGRAM_ALLOWED_CHAT_ID, fetchImpl }) : null);

  return http.createServer(async (request, response) => {
    applyCors(request, response, config);

    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }

    const requestUrl = new URL(request.url ?? '/', 'http://gateway.local');
    if (request.method === 'GET' && requestUrl.pathname === '/health') {
      writeJson(response, 200, { success: true, data: { status: 'ok' } });
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/ready') {
      writeJson(response, 200, { success: true, data: { status: 'ready' } });
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/auth/login') {
      try {
        const body = JSON.parse((await readBody(request))?.toString() || '{}');
        const data = await login(body.senha, config.auth);
        writeJson(response, 200, { success: true, data });
      } catch (error) {
        const status = error instanceof AuthError ? error.statusCode : 400;
        writeJson(response, status, { success: false, error: error.message || 'Erro ao processar autenticação.' });
      }
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/bot/webhook' && botService) {
      if (!botService.configurado()) { writeJson(response, 503, { success: false, error: 'Bot não configurado.' }); return; }
      if (!botService.secretValido(request.headers['x-telegram-bot-api-secret-token'])) { writeJson(response, 401, { success: false, error: 'Não autorizado.' }); return; }
      try { await botService.processar(JSON.parse((await readBody(request))?.toString() || '{}')); writeJson(response, 200, { success: true }); } catch { writeJson(response, 500, { success: false, error: 'Erro ao processar atualização.' }); } return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/dashboard' && dashboardService) {
      const result = await getDashboard(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), {
        auth: config.auth,
        dashboardService,
      });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/dashboard/historico' && dashboardService) {
      const result = await getDashboardHistory(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), {
        auth: config.auth,
        dashboardService,
      });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/configuracoes' && configuracoesService) {
      const result = await getConfiguracoes(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), {
        auth: config.auth,
        configuracoesService,
      });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'PUT' && requestUrl.pathname === '/api/configuracoes' && configuracoesService) {
      const body = await readBody(request);
      const result = await putConfiguracoes(new Request(requestUrl, {
        method: 'PUT', headers: forwardHeaders(request.headers), body,
      }), { auth: config.auth, configuracoesService });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/relatorios' && relatoriosService) {
      const result = await getRelatorios(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, relatoriosService });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/exportar' && exportacaoService) {
      try { if (requestUrl.searchParams.get('formato') !== 'csv') throw Object.assign(new Error('Formato não suportado ou não informado'), { statusCode: 400 }); const csv = await exportacaoService.csv(requestUrl.searchParams.get('mes')); response.writeHead(200, { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="relatorio_${requestUrl.searchParams.get('mes')}.csv"` }); response.end(csv); } catch (error) { writeJson(response, error.statusCode || 500, { error: error.message || 'Erro interno' }); } return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/cartoes' && cartoesService) {
      const result = await getCartoes(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, cartoesService });
      writeJson(response, result.status, result.body);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/orcamentos' && orcamentosService) {
      const result = await getOrcamentos(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, orcamentosService }); writeJson(response, result.status, result.body); return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/orcamentos' && orcamentosService) {
      const result = await postOrcamentos(new Request(requestUrl, { method: 'POST', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, orcamentosService }); writeJson(response, result.status, result.body); return;
    }
    const orcamentoId = requestUrl.pathname.match(/^\/api\/orcamentos\/([^/]+)$/)?.[1];
    if (orcamentoId && request.method === 'PUT' && orcamentosService) {
      const result = await putOrcamento(new Request(requestUrl, { method: 'PUT', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, orcamentosService }, orcamentoId); writeJson(response, result.status, result.body); return;
    }
    if (orcamentoId && request.method === 'DELETE' && orcamentosService) {
      const result = await deleteOrcamento(new Request(requestUrl, { method: 'DELETE', headers: forwardHeaders(request.headers) }), { auth: config.auth, orcamentosService }, orcamentoId); writeJson(response, result.status, result.body); return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/cartoes' && cartoesService) {
      const result = await postCartoes(new Request(requestUrl, { method: 'POST', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, cartoesService }); writeJson(response, result.status, result.body); return;
    }
    const cartaoId = requestUrl.pathname.match(/^\/api\/cartoes\/([^/]+)$/)?.[1];
    if (cartaoId && request.method === 'PUT' && cartoesService) {
      const result = await putCartao(new Request(requestUrl, { method: 'PUT', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, cartoesService }, cartaoId); writeJson(response, result.status, result.body); return;
    }
    if (cartaoId && request.method === 'DELETE' && cartoesService) {
      const result = await deleteCartao(new Request(requestUrl, { method: 'DELETE', headers: forwardHeaders(request.headers) }), { auth: config.auth, cartoesService }, cartaoId); writeJson(response, result.status, result.body); return;
    }
    if (!requestUrl.pathname.startsWith('/api/')) {
      writeJson(response, 404, { success: false, error: 'Rota não encontrada.' });
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/metas' && metasService) {
      const result = await getMetas(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, metasService }); writeJson(response, result.status, result.body); return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/metas' && metasService) {
      const result = await postMetas(new Request(requestUrl, { method: 'POST', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, metasService }); writeJson(response, result.status, result.body); return;
    }
    const metaRoute = requestUrl.pathname.match(/^\/api\/metas\/([^/]+)(?:\/(ativar))?$/);
    if (metaRoute && metasService) {
      const [, metaId, acao] = metaRoute;
      const dependencies = { auth: config.auth, metasService };
      if (!acao && request.method === 'PUT') { const result = await putMeta(new Request(requestUrl, { method: 'PUT', headers: forwardHeaders(request.headers), body: await readBody(request) }), dependencies, metaId); writeJson(response, result.status, result.body); return; }
      if (!acao && request.method === 'DELETE') { const result = await deleteMeta(new Request(requestUrl, { method: 'DELETE', headers: forwardHeaders(request.headers) }), dependencies, metaId); writeJson(response, result.status, result.body); return; }
      if (acao && request.method === 'POST') { const result = await postAtivarMeta(new Request(requestUrl, { method: 'POST', headers: forwardHeaders(request.headers), body: await readBody(request) }), dependencies, metaId); writeJson(response, result.status, result.body); return; }
      if (acao && request.method === 'DELETE') { const result = await deleteAtivarMeta(new Request(requestUrl, { method: 'DELETE', headers: forwardHeaders(request.headers) }), dependencies, metaId); writeJson(response, result.status, result.body); return; }
    }
    if (request.method === 'GET' && requestUrl.pathname === '/api/investimentos' && investimentosService) {
      const result = await getInvestimentos(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, investimentosService }); writeJson(response, result.status, result.body); return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/api/investimentos' && investimentosService) {
      const result = await postInvestimentos(new Request(requestUrl, { method: 'POST', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, investimentosService }); writeJson(response, result.status, result.body); return;
    }
    if (request.method === 'GET' && cotacoesService) {
      const cotacaoPaths = { '/api/investimentos/busca': 'busca', '/api/investimentos/cotacoes': 'cotacoes', '/api/investimentos/cotacoes/historico': 'historico', '/api/investimentos/cotacoes/stats': 'stats' };
      const action = cotacaoPaths[requestUrl.pathname];
      if (action) { const result = await cotacaoController(new Request(requestUrl, { headers: forwardHeaders(request.headers) }), { auth: config.auth, cotacoesService }, action); writeJson(response, result.status, result.body); return; }
    }
    const investimentoId = requestUrl.pathname.match(/^\/api\/investimentos\/([^/]+)$/)?.[1];
    if (investimentoId && request.method === 'PUT' && investimentosService) {
      const result = await putInvestimento(new Request(requestUrl, { method: 'PUT', headers: forwardHeaders(request.headers), body: await readBody(request) }), { auth: config.auth, investimentosService }, investimentoId); writeJson(response, result.status, result.body); return;
    }
    if (investimentoId && request.method === 'DELETE' && investimentosService) {
      const result = await deleteInvestimento(new Request(requestUrl, { method: 'DELETE', headers: forwardHeaders(request.headers) }), { auth: config.auth, investimentosService }, investimentoId); writeJson(response, result.status, result.body); return;
    }
    const financiamento = requestUrl.pathname.match(/^\/api\/financiamentos(?:\/([^/]+)(?:\/(tabela|indices|simulacoes|amortizacoes|pagamentos)(?:\/([^/]+))?)?)?$/);
    if (financiamento && financiamentosService) {
      const [, financiamentoId, recurso, recursoId] = financiamento;
      const deps = { auth: config.auth, financiamentosService };
      const nativeRequest = new Request(requestUrl, { method: request.method, headers: forwardHeaders(request.headers), body: ['GET', 'HEAD', 'DELETE'].includes(request.method) ? undefined : await readBody(request) });
      let acao;
      if (!financiamentoId && request.method === 'GET') acao = 'listar';
      else if (!financiamentoId && request.method === 'POST') acao = 'criar';
      else if (financiamentoId && !recurso && request.method === 'GET') acao = 'obter';
      else if (financiamentoId && !recurso && request.method === 'PUT') acao = 'atualizar';
      else if (financiamentoId && !recurso && request.method === 'DELETE') acao = 'remover';
      else if (recurso === 'tabela' && request.method === 'GET') acao = 'tabela';
      else if (recurso === 'indices' && request.method === 'GET') acao = 'indices';
      else if (recurso === 'simulacoes' && request.method === 'POST') acao = 'simular';
      else if (recurso === 'amortizacoes' && !recursoId && request.method === 'POST') acao = 'registrarAmortizacao';
      else if (recurso === 'amortizacoes' && recursoId && request.method === 'PUT') acao = 'atualizarAmortizacao';
      else if (recurso === 'amortizacoes' && recursoId && request.method === 'DELETE') acao = 'removerAmortizacao';
      else if (recurso === 'pagamentos' && !recursoId && request.method === 'POST') acao = 'registrarPagamento';
      else if (recurso === 'pagamentos' && recursoId && request.method === 'DELETE') acao = 'removerPagamento';
      if (acao) { const result = await executarFinanciamento(nativeRequest, deps, acao, financiamentoId, recursoId); writeJson(response, result.status, result.body); return; }
    }
    const lancamento = requestUrl.pathname.match(/^\/api\/(gastos-fixos|gastos-variaveis|receitas)(?:\/([^/]+)(?:\/(status|serie))?)?$/);
    if (lancamento) {
      const controller = lancamento[1] === 'gastos-fixos' ? gastosFixosController : lancamento[1] === 'gastos-variaveis' ? gastosVariaveisController : receitasController;
      if (controller) {
        const [, , id, acao] = lancamento;
        const nativeRequest = new Request(requestUrl, { method: request.method, headers: forwardHeaders(request.headers), body: ['GET', 'HEAD', 'DELETE'].includes(request.method) ? undefined : await readBody(request) });
        let result;
        if (!id && request.method === 'GET') result = await controller.listar(nativeRequest);
        else if (!id && request.method === 'POST') result = await controller.criar(nativeRequest);
        else if (id && !acao && request.method === 'PUT') result = await controller.atualizar(nativeRequest, id);
        else if (id && acao === 'status' && request.method === 'PATCH') result = await controller.atualizarStatus(nativeRequest, id);
        else if (id && acao === 'serie' && request.method === 'DELETE') result = await controller.removerSerie(nativeRequest, id);
        else if (id && !acao && request.method === 'DELETE') result = await controller.remover(nativeRequest, id);
        if (result) { writeJson(response, result.status, result.body); return; }
      }
    }

    // Todas as rotas do contrato foram extraídas; nenhuma rota é encaminhada ao monólito.
    writeJson(response, 404, { success: false, error: 'Rota não encontrada.' });
    return;

    const targetUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, config.legacyOrigin);
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), config.upstreamTimeoutMs);

    try {
      const upstream = await fetchImpl(targetUrl, {
        method: request.method,
        headers: forwardHeaders(request.headers),
        body: ['GET', 'HEAD'].includes(request.method ?? '') ? undefined : await readBody(request),
        signal: abortController.signal,
      });
      const headers = {};
      upstream.headers.forEach((value, name) => {
        if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) headers[name] = value;
      });
      response.writeHead(upstream.status, headers);
      response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      writeJson(response, timedOut ? 504 : 502, {
        success: false,
        error: timedOut ? 'Tempo limite ao comunicar com o serviço financeiro.' : 'Não foi possível comunicar com o serviço financeiro.',
      });
    } finally {
      clearTimeout(timeout);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = loadConfig();
  createServer(config).listen(config.port, () => {
    console.log(`Financeiro API escutando na porta ${config.port}`);
  });
}
