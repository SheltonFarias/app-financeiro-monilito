import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
import { pagamentoSchema } from '@/backend/modules/financiamentos/financiamentos.schema';
export const POST = withAuth(async (req, ctx) => { try { return NextResponse.json({ success: true, data: await FinanciamentosService.registrarPagamento((await ctx.params).id, pagamentoSchema.parse(await req.json())) }, { status: 201 }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 400 }); } });
