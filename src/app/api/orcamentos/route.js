
import { NextResponse } from 'next/server';
import { OrcamentosService } from '@/backend/modules/orcamentos/orcamentos.service';
import { orcamentoSchema } from '@/backend/modules/orcamentos/orcamentos.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = await OrcamentosService.listar(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const dados = orcamentoSchema.parse(body);
    const data = await OrcamentosService.criar(dados);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
