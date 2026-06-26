
import { NextResponse } from 'next/server';
import { ReceitasService } from '@/backend/modules/receitas/receitas.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');
    const data = ReceitasService.listar(mes);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const data = ReceitasService.criar(body);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
