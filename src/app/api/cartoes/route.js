
import { NextResponse } from 'next/server';
import { CartoesService } from '@/backend/modules/cartoes/cartoes.service';
import { cartaoSchema } from '@/backend/modules/cartoes/cartoes.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = CartoesService.listar(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const dados = cartaoSchema.parse(body);
    const data = CartoesService.criar(dados);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
