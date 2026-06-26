
import { NextResponse } from 'next/server';
import { OrcamentosService } from '@/backend/modules/orcamentos/orcamentos.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const data = OrcamentosService.atualizar(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    OrcamentosService.deletar(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
