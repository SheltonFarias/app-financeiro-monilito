import { NextResponse } from 'next/server';
import { ConfiguracoesService } from '@/backend/modules/configuracoes/configuracoes.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (request) => {
  try {
    const config = await ConfiguracoesService.getAllParsed();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Erro GET /api/configuracoes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
});

export const PUT = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { chave, valor } = body;

    const result = await ConfiguracoesService.updateConfig(chave, valor);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro PUT /api/configuracoes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
});
