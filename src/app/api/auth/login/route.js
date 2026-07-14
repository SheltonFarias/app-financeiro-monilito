
import { NextResponse } from 'next/server';
import { AuthService } from '@/backend/modules/auth/auth.service';

export async function POST(req) {
  try {
    const body = await req.json();
    const data = await AuthService.login(body.senha);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 400 });
  }
}
