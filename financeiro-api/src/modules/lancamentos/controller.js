import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';

const status = (error) => error instanceof AuthError ? error.statusCode : error.statusCode || 400;
const fail = (error) => ({ status: status(error), body: { success: false, error: error.message } });
export function createLancamentosController(service) {
  async function executar(request, acao, id, successStatus = 200) { try { await authorize(request.headers, service.auth); const body = ['criar', 'atualizar', 'atualizarStatus'].includes(acao) ? await request.json() : null; const data = acao === 'listarPorMes' ? await service.impl[acao](new URL(request.url).searchParams.get('mes')) : id ? await service.impl[acao](id, body?.situacao ?? body) : await service.impl[acao](body); return { status: successStatus, body: { success: true, data } }; } catch (error) { return fail(error); } }
  return { listar: (request) => executar(request, 'listarPorMes'), criar: (request) => executar(request, 'criar', null, 201), atualizar: (request, id) => executar(request, 'atualizar', id), atualizarStatus: (request, id) => executar(request, 'atualizarStatus', id), remover: async (request, id) => { const result = await executar(request, 'remover', id); return result.status === 200 ? { ...result, body: { success: true, data: { message: 'Registro removido com sucesso.' } } } : result; }, removerSerie: async (request, id) => { const result = await executar(request, 'removerSerie', id); return result.status === 200 ? { ...result, body: { success: true, data: { message: 'Série removida com sucesso.' } } } : result; } };
}
