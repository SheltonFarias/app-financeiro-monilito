import { AuthError } from '../auth/service.js';
import { authorize } from '../auth/authorize.js';

export async function getConfiguracoes(request, { auth, configuracoesService }) {
  try {
    await authorize(request.headers, auth);
    const data = await configuracoesService.getAllParsed();
    return { status: 200, body: { success: true, data } };
  } catch (error) {
    return {
      status: error instanceof AuthError ? error.statusCode : error.statusCode || error.status || 500,
      body: { success: false, error: error.message || 'Erro interno do servidor.' },
    };
  }
}

export async function putConfiguracoes(request, { auth, configuracoesService }) {
  try {
    await authorize(request.headers, auth);
    const { chave, valor } = await request.json();
    const data = await configuracoesService.updateConfig(chave, valor);
    return { status: 200, body: { success: true, data } };
  } catch (error) {
    return {
      status: error instanceof AuthError ? error.statusCode : error.statusCode || error.status || 500,
      body: { success: false, error: error.message || 'Erro interno do servidor.' },
    };
  }
}
