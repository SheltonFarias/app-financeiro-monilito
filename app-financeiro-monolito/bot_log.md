# Log de Criação do Bot Telegram (Webhook Serverless)

## Status Inicial
- **Opção Escolhida:** 2 (Serverless Webhook via Next.js API Routes).
- **Justificativa:** Integrado nativamente no fluxo do Next.js; não há necessidade de rodar um script em paralelo. Exige uso de webhook externo em produção, e ngrok em desenvolvimento.

## Próximos Passos (Para o Usuário)
1. Crie seu bot com o [BotFather](https://t.me/botfather) no Telegram e pegue o Token.
2. Adicione no final do seu arquivo `.env`: `TELEGRAM_BOT_TOKEN=seu_token_aqui`
3. Instale o ngrok (se ainda não tiver) e rode: `ngrok http 3000`
4. Pegue o link `https` gerado pelo ngrok e acesse no navegador: `https://api.telegram.org/bot<SEU_TOKEN>/setWebhook?url=<LINK_NGROK>/api/bot/webhook` (Substitua as variáveis pelas suas)
5. Após receber `{"ok":true,"result":true,"description":"Webhook was set"}`, vá no seu Bot do Telegram e mande os comandos `/resumo`, `/gasto 50 Pizza`, `/receita 100 Venda`.

## Histórico de Alterações
- *2026-08-20*: Inicialização do documento e definição de arquitetura Serverless.
- *2026-08-20*: Dependência `telegraf` instalada no `package.json`.
- *2026-08-20*: Criado `src/app/api/bot/webhook/route.js` para integração via webhook.
- *2026-08-20*: Criado `src/backend/bot/instance.js` para gerenciar a instância do bot.
- *2026-08-20*: Criado `src/backend/bot/handlers.js` com comandos básicos injetando nos Services do monolith (`/resumo`, `/gasto`, `/receita`).