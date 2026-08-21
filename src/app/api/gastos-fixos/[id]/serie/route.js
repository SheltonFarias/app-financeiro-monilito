
import { NextResponse } from 'next/server';
import { GastosFixosService } from '@/backend/modules/gastos-fixos/gastosFixos.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    await GastosFixosService.removerSerie(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('[DELETE /api/gastos-fixos/:id/serie] Erro:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno' },
      { status: error.status || 500 }
    );
  }
});
