
import { NextResponse } from 'next/server';
import { GastosFixosService } from '@/backend/modules/gastos-fixos/gastosFixos.service';
import { withAuth } from '@/backend/middlewares/next-auth';
import { gastoFixoSchema } from '@/backend/modules/gastos-fixos/gastosFixos.schema';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const dados = gastoFixoSchema.parse(body);
    const data = GastosFixosService.atualizar(Number(id), dados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    GastosFixosService.remover(Number(id));
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
