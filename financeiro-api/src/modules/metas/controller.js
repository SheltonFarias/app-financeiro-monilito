import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';
const falha = (error) => ({ status: error instanceof AuthError ? error.statusCode : error.statusCode || 400, body: { success: false, error: error.message } });
export async function getMetas(request, { auth, metasService }) { try { await authorize(request.headers, auth); return { status: 200, body: { success: true, data: await metasService.listar() } }; } catch (error) { return falha(error); } }
async function executar(request, { auth, metasService }, metodo, id, status = 200) { try { await authorize(request.headers, auth); const text = ['deletar', 'desativarContribuicao'].includes(metodo) ? '' : await request.text(); const body = text ? JSON.parse(text) : {}; const data = !id ? await metasService[metodo](body) : metodo === 'atualizar' ? await metasService.atualizar(id, body) : metodo === 'ativarContribuicao' ? await metasService.ativarContribuicao(id, body.mes) : await metasService[metodo](id); return { status, body: { success: true, data } }; } catch (error) { return falha(error); } }
export const postMetas = (request, dependencies) => executar(request, dependencies, 'criar', null, 201);
export const putMeta = (request, dependencies, id) => executar(request, dependencies, 'atualizar', id);
export const deleteMeta = (request, dependencies, id) => executar(request, dependencies, 'deletar', id);
export const postAtivarMeta = (request, dependencies, id) => executar(request, dependencies, 'ativarContribuicao', id);
export const deleteAtivarMeta = (request, dependencies, id) => executar(request, dependencies, 'desativarContribuicao', id);
