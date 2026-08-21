
import { NextResponse } from 'next/server';
import { DashboardService } from '@/backend/modules/dashboard/dashboard.service';
import { withAuth } from '@/backend/middlewares/next-auth';

export const GET = withAuth(async (req) => {
  try {
    const data = await DashboardService.carregarHistorico();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
});
