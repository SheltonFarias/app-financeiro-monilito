
import { NextResponse } from 'next/server';
import { GastosFixosService } from '@/backend/modules/gastos-fixos/gastosFixos.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const data = GastosFixosService.atualizar(id, body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    GastosFixosService.deletar(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
