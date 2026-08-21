import { NextResponse } from 'next/server';
import { GastosVariaveisService } from '@/backend/modules/gastos-variaveis/gastosVariaveis.service';
import { withAuth } from '@/backend/middlewares/next-auth';

/**
 * DELETE /api/gastos-variaveis/:id/serie
 * Remove todas as parcelas do mesmo grupo_id do registro indicado.
 * Se o registro for avulso (sem grupo_id), remove apenas ele.
 */
export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    const resultado = await GastosVariaveisService.removerSerie(id);
    return NextResponse.json({ success: true, data: resultado });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 400 }
    );
  }
});
