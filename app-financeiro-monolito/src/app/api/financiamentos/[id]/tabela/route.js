import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
export const GET = withAuth(async (_req, ctx) => { try { return NextResponse.json({ success: true, data: await FinanciamentosService.tabela((await ctx.params).id) }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 }); } });
