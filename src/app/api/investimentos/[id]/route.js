
import { NextResponse } from 'next/server';
import { InvestimentosService } from '@/backend/modules/investimentos/investimentos.service';
import { investimentoSchema } from '@/backend/modules/investimentos/investimentos.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const dados = investimentoSchema.parse(body);
    const data = InvestimentosService.atualizar(id, dados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    InvestimentosService.remover(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
