import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
import { amortizacaoSchema } from '@/backend/modules/financiamentos/financiamentos.schema';
export const PUT = withAuth(async (req, ctx) => { try { const p = await ctx.params; return NextResponse.json({ success: true, data: await FinanciamentosService.atualizarAmortizacao(p.id, p.amortizacaoId, amortizacaoSchema.parse(await req.json())) }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 }); } });
export const DELETE = withAuth(async (_req, ctx) => { try { const p = await ctx.params; await FinanciamentosService.removerAmortizacao(p.id, p.amortizacaoId); return NextResponse.json({ success: true, data: { deleted: true } }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 }); } });
