import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';

export const GET = withAuth(async (_req, ctx) => {
  try {
    const financiamento = await FinanciamentosService.obter((await ctx.params).id);
    const indices = await FinanciamentosService.indices(financiamento);
    return NextResponse.json({ success: true, data: Object.fromEntries(indices) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 });
  }
});
