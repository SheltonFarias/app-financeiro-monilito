
import { NextResponse } from 'next/server';
import { GastosFixosService } from '@/backend/modules/gastos-fixos/gastosFixos.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PATCH = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const data = GastosFixosService.atualizarStatus(id, body.situacao);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
