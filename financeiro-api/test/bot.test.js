import test from 'node:test'; import assert from 'node:assert/strict'; import { createBotService } from '../src/modules/bot/service.js';
test('webhook do bot valida o segredo em tempo constante', () => { const bot = createBotService({}, { token: 'token', webhookSecret: 'segredo' }); assert.equal(bot.configurado(), true); assert.equal(bot.secretValido('segredo'), true); assert.equal(bot.secretValido('outro'), false); });

test('comando de gasto grava lançamento no serviço independente', async () => {
  let criado; const mensagens = [];
  const bot = createBotService({ gastoVariavel: { create: async ({ data }) => { criado = data; return { id: '1', ...data }; } } }, { token: 'token', webhookSecret: 'segredo', allowedChatId: '10', fetchImpl: async (_url, options) => { mensagens.push(JSON.parse(options.body)); return { ok: true }; } });
  await bot.processar({ message: { chat: { id: 10 }, text: '/gasto 50,90 Mercado' } });
  assert.equal(criado.valor, 50.9); assert.equal(criado.descricao, 'Mercado'); assert.equal(criado.pagamento, 'Pix'); assert.match(mensagens[0].text, /registrado/);
});
