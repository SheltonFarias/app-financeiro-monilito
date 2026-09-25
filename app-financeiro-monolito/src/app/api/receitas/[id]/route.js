
import { NextResponse } from 'next/server';
import { ReceitasService } from '@/backend/modules/receitas/receitas.service';
import { receitaSchema } from '@/backend/modules/receitas/receitas.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const dados = receitaSchema.parse(body);
    const data = await ReceitasService.atualizar(id, dados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    await ReceitasService.remover(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
