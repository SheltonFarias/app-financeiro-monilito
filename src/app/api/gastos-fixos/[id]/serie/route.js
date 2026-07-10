
import { NextResponse } from 'next/server';
import { GastosFixosService } from '@/backend/modules/gastos-fixos/gastosFixos.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    GastosFixosService.removerSerie(Number(id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
