import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
export const DELETE = withAuth(async (_req, ctx) => { try { const p = await ctx.params; await FinanciamentosService.removerPagamento(p.id, p.pagamentoId); return NextResponse.json({ success: true, data: { deleted: true } }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 }); } });
