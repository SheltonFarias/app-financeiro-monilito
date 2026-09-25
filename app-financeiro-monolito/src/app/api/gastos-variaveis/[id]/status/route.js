
import { NextResponse } from 'next/server';
import { GastosVariaveisService } from '@/backend/modules/gastos-variaveis/gastosVariaveis.service';
import { updateStatusSchema } from '@/backend/modules/gastos-variaveis/gastosVariaveis.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const { situacao } = updateStatusSchema.parse(body);
    const data = await GastosVariaveisService.atualizarStatus(id, situacao);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
