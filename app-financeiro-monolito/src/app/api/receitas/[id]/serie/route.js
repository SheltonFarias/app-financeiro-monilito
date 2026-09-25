import { NextResponse } from 'next/server';
import { ReceitasService } from '@/backend/modules/receitas/receitas.service';
import { withAuth } from '@/backend/middlewares/next-auth';

/**
 * DELETE /api/receitas/:id/serie
 * Remove o template de recorrência e todas as cópias auto-geradas.
 * Se chamado com uma cópia (template_id != null), resolve o template automaticamente.
 */
export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    await ReceitasService.removerSerie(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 400 }
    );
  }
});
