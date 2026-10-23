import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';
export async function getRelatorios(request, { auth, relatoriosService }) {
  try {
    await authorize(request.headers, auth);
    const params = new URL(request.url).searchParams; const tipo = params.get('tipo'); const mes = params.get('mes');
    if (tipo === 'projecao') { if (!mes) throw Object.assign(new Error('Parâmetro mes é obrigatório'), { statusCode: 400 }); return { status: 200, body: { success: true, data: await relatoriosService.gerarProjecao(mes, 11) } }; }
    if (tipo === 'categoria') { if (!mes) throw Object.assign(new Error('Parâmetro mes é obrigatório'), { statusCode: 400 }); return { status: 200, body: { success: true, data: await relatoriosService.agruparPorCategoria(mes) } }; }
    if (tipo === 'historico') return { status: 200, body: { success: true, data: await relatoriosService.historicoConsolidado() } };
    if (tipo === 'comparacao') { const mes1 = params.get('mes1'); const mes2 = params.get('mes2'); if (!mes1 || !mes2) throw Object.assign(new Error('Parâmetros mes1 e mes2 são obrigatórios'), { statusCode: 400 }); return { status: 200, body: { success: true, data: await relatoriosService.compararMeses(mes1, mes2) } }; }
    if (!mes) throw Object.assign(new Error('Parâmetro mes é obrigatório'), { statusCode: 400 });
    const [projecao, categorias, historico] = await Promise.all([relatoriosService.gerarProjecao(mes, 11), relatoriosService.agruparPorCategoria(mes), relatoriosService.historicoConsolidado()]);
    return { status: 200, body: { success: true, data: { projecao, categorias, historico } } };
  } catch (error) { return { status: error instanceof AuthError ? error.statusCode : error.statusCode || 500, body: { success: false, error: error.message || 'Erro interno' } }; }
}
