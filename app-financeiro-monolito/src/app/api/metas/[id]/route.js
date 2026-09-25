
import { NextResponse } from 'next/server';
import { MetasService } from '@/backend/modules/metas/metas.service';
import { metaSchema } from '@/backend/modules/metas/metas.schema';
import { withAuth } from '@/backend/middlewares/next-auth';

export const PUT = withAuth(async (req, { params }) => {
  try {
    const body = await req.json();
    const { id } = await params;
    const dados = metaSchema.parse(body);
    const data = await MetasService.atualizar(id, dados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});

export const DELETE = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    await MetasService.deletar(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
