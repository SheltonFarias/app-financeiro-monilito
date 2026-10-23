import dashboardDomain from '../../domain/dashboard.cjs';

const { createDashboardService } = dashboardDomain;

/**
 * Composição da regra compartilhada para a futura fonte PostgreSQL da API.
 * O adapter de banco será conectado aqui antes de a rota sair do proxy.
 */
export function createApiDashboardService(dependencies) {
  return createDashboardService(
    dependencies,
    (message, statusCode) => Object.assign(new Error(message), { statusCode }),
  );
}
