import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';
export async function getCartoes(request, { auth, cartoesService }) {
  try { await authorize(request.headers, auth); return { status: 200, body: { success: true, data: await cartoesService.listar() } }; }
  catch (error) { return { status: error instanceof AuthError ? error.statusCode : error.statusCode || error.status || 400, body: { success: false, error: error.message } }; }
}
async function executar(request, dependencies, acao, status = 200) {
  try { await authorize(request.headers, dependencies.auth); const body = await request.json(); return { status, body: { success: true, data: await dependencies.cartoesService[acao](body) } }; }
  catch (error) { return { status: error instanceof AuthError ? error.statusCode : error.statusCode || 400, body: { success: false, error: error.message } }; }
}
export const postCartoes = (request, dependencies) => executar(request, dependencies, 'criar', 201);
export async function putCartao(request, dependencies, id) { try { await authorize(request.headers, dependencies.auth); return { status: 200, body: { success: true, data: await dependencies.cartoesService.atualizar(id, await request.json()) } }; } catch (error) { return { status: error instanceof AuthError ? error.statusCode : error.statusCode || 400, body: { success: false, error: error.message } }; } }
export async function deleteCartao(request, dependencies, id) { try { await authorize(request.headers, dependencies.auth); return { status: 200, body: { success: true, data: await dependencies.cartoesService.deletar(id) } }; } catch (error) { return { status: error instanceof AuthError ? error.statusCode : error.statusCode || 400, body: { success: false, error: error.message } }; } }
