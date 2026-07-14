
import { NextResponse } from 'next/server';
import { ReceitasService } from '@/backend/modules/receitas/receitas.service';
import { updateStatusSchema } from '@/backend/modules/receitas/receitas.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const { situacao } = updateStatusSchema.parse(body);
    const data = ReceitasService.atualizarStatus(id, situacao);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
