
import { NextResponse } from 'next/server';
import { GastosVariaveisService } from '@/backend/modules/gastos-variaveis/gastosVariaveis.service';
import { gastoVariavelSchema } from '@/backend/modules/gastos-variaveis/gastosVariaveis.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = GastosVariaveisService.listarPorMes(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const dados = gastoVariavelSchema.parse(body);
    const data = GastosVariaveisService.criar(dados);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
