import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';

/**
 * Controller independente de transporte. Quando DashboardService migrar para a
 * API, este controller substituirá o proxy sem que seu contrato HTTP mude.
 */
export async function getDashboard(request, { auth, dashboardService }) {
  try {
    await authorize(request.headers, auth);
    const mes = new URL(request.url).searchParams.get('mes');
    const data = await dashboardService.carregarDados(mes);
    return { status: 200, body: { success: true, data } };
  } catch (error) {
    return {
      status: error instanceof AuthError ? error.statusCode : error.statusCode || error.status || 400,
      body: { success: false, error: error.message || 'Erro interno do servidor.' },
    };
  }
}

export async function getDashboardHistory(request, { auth, dashboardService }) {
  try {
    await authorize(request.headers, auth);
    const data = await dashboardService.carregarHistorico();
    return { status: 200, body: { success: true, data } };
  } catch (error) {
    return {
      status: error instanceof AuthError ? error.statusCode : error.statusCode || error.status || 400,
      body: { success: false, error: error.message || 'Erro interno do servidor.' },
    };
  }
}
