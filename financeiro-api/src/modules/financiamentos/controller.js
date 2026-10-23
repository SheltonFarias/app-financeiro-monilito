import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';
const falha = (error) => ({ status: error instanceof AuthError ? error.statusCode : error.statusCode || 400, body: { success: false, error: error.message } });
export async function executarFinanciamento(request, { auth, financiamentosService }, acao, id, subId) {
  try { await authorize(request.headers, auth); const corpo = ['criar', 'atualizar', 'simular', 'registrarAmortizacao', 'atualizarAmortizacao', 'registrarPagamento'].includes(acao) ? await request.json() : undefined; let data;
    if (acao === 'listar') data = await financiamentosService.listar(); else if (acao === 'criar') data = await financiamentosService.criar(corpo); else if (acao === 'obter' || acao === 'tabela') data = await financiamentosService[acao](id); else if (acao === 'indices') data = Object.fromEntries(await financiamentosService.indices(id)); else if (acao === 'atualizar') data = await financiamentosService.atualizar(id, corpo); else if (acao === 'remover') { await financiamentosService.remover(id); data = { deleted: true }; } else if (acao === 'simular' || acao === 'registrarAmortizacao' || acao === 'registrarPagamento') data = await financiamentosService[acao](id, corpo); else if (acao === 'atualizarAmortizacao') data = await financiamentosService.atualizarAmortizacao(id, subId, corpo); else if (acao === 'removerAmortizacao') { await financiamentosService.removerAmortizacao(id, subId); data = { deleted: true }; } else { await financiamentosService.removerPagamento(id, subId); data = { deleted: true }; }
    return { status: acao === 'criar' ? 201 : 200, body: { success: true, data } };
  } catch (error) { return falha(error); }
}
