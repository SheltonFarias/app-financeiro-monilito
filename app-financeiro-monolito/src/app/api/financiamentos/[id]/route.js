import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
import { financiamentoSchema } from '@/backend/modules/financiamentos/financiamentos.schema';

async function idDo(ctx) { return (await ctx.params).id; }
function responder(fn) { return withAuth(async (req, ctx) => { try { return NextResponse.json({ success: true, data: await fn(req, await idDo(ctx)) }); } catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || error.status || 400 }); } }); }
export const GET = responder((_req, id) => FinanciamentosService.obter(id));
export const PUT = responder(async (req, id) => FinanciamentosService.atualizar(id, financiamentoSchema.parse(await req.json())));
export const DELETE = responder(async (_req, id) => { await FinanciamentosService.remover(id); return { deleted: true }; });
