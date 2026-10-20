import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { bot } from '@/backend/bot/instance';
import { setupBot } from '@/backend/bot/handlers';

setupBot(bot);

export const runtime = 'nodejs';

function segredoValido(valorRecebido, segredoConfigurado) {
  if (!valorRecebido || !segredoConfigurado) return false;
  const recebido = Buffer.from(valorRecebido);
  const configurado = Buffer.from(segredoConfigurado);
  return recebido.length === configurado.length && timingSafeEqual(recebido, configurado);
}

export async function POST(req) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) {
      console.error('[Telegram Webhook] Configuração do bot ausente.');
      return NextResponse.json({ success: false, error: 'Bot não configurado.' }, { status: 503 });
    }

    const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
    if (!segredoValido(secretToken, process.env.TELEGRAM_WEBHOOK_SECRET)) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Telegram Webhook Error]', error);
    return NextResponse.json({ success: false, error: 'Erro ao processar atualização.' }, { status: 500 });
  }
}
