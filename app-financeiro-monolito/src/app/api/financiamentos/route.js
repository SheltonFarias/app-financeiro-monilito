import { NextResponse } from 'next/server';
import { withAuth } from '@/backend/middlewares/next-auth';
import { FinanciamentosService } from '@/backend/modules/financiamentos/financiamentos.service';
import { financiamentoSchema } from '@/backend/modules/financiamentos/financiamentos.schema';

const responder = (fn, status = 200) => withAuth(async (req) => {
  try { return NextResponse.json({ success: true, data: await fn(req) }, { status }); }
  catch (error) { return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || error.status || 400 }); }
});

export const GET = responder(() => FinanciamentosService.listar());
export const POST = responder(async (req) => FinanciamentosService.criar(financiamentoSchema.parse(await req.json())), 201);
