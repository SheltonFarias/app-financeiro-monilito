
import { NextResponse } from 'next/server';
import { GastosVariaveisService } from '@/backend/modules/gastos-variaveis/gastosVariaveis.service';
import { gastoVariavelSchema } from '@/backend/modules/gastos-variaveis/gastosVariaveis.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const dados = gastoVariavelSchema.parse(body);
    const data = GastosVariaveisService.atualizar(Number(id), dados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    GastosVariaveisService.remover(Number(id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
