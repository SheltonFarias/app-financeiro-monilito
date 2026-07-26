import { NextResponse } from 'next/server';
import { MetasService } from '@/backend/modules/metas/metas.service';
import { withAuth } from '@/backend/middlewares/next-auth';

/**
 * POST /api/metas/:id/ativar
 * Ativa a contribuição mensal automática para a meta indicada.
 * Cria um Gasto Variável recorrente e vincula o ID à meta.
 */
export const POST = withAuth(async (req, { params }) => {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const mesAtual = body.mesAtual || null;

    const data = MetasService.ativarContribuicao(id, mesAtual);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Erro POST /api/metas/:id/ativar:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
});

/**
 * DELETE /api/metas/:id/ativar
 * Desativa a contribuição mensal (mantém o gasto variável, apenas remove o vínculo).
 */
export const DELETE = withAuth(async (req, { params }) => {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const data = MetasService.desativarContribuicao(id);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Erro DELETE /api/metas/:id/ativar:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode || 400 }
    );
  }
});
