import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
export const bot = new Telegraf(token);

// Middleware para logging de mensagens (útil para debug)
bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log('[Telegram Bot] Respondeu em %sms', ms);
});
