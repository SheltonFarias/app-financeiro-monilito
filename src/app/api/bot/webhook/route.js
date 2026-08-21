import { NextResponse } from 'next/server';
import { bot } from '@/backend/bot/instance';
import { setupBot } from '@/backend/bot/handlers';

// Inicializa os comandos do bot apenas uma vez
setupBot(bot);

export async function POST(req) {
  try {
    // Processa a atualização via webhook (Serverless mode)
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telegram Webhook Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
