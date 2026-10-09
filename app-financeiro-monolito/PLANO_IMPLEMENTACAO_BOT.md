# Plano de Implementação — Bot Financeiro no Telegram

## Objetivo

Disponibilizar no Telegram uma interface segura para consultar o resumo mensal e registrar receitas e gastos no mesmo banco de dados usado pelo aplicativo Next.js.

## Diagnóstico do estado atual

O projeto já contém `telegraf`, a rota `POST /api/bot/webhook`, uma instância do bot e os comandos `/start`, `/resumo`, `/gasto` e `/receita`. Contudo, o fluxo não está pronto para produção:

- os serviços chamados pelos handlers são assíncronos, mas não recebem `await`;
- o mês está fixo em `Agosto2026`;
- não há associação entre `chat_id` do Telegram e uma conta do aplicativo;
- o endpoint aceita atualizações sem validar a origem do webhook;
- os dados de entrada não passam pelas mesmas validações das rotas HTTP;
- a inicialização dos handlers pode ser repetida em execuções serverless;
- faltam testes, observabilidade e procedimento de configuração/publicação.

## Escopo da primeira versão (MVP)

- Vincular um chat autorizado a uma conta do sistema.
- Consultar o resumo do mês atual: `/resumo`.
- Registrar gasto: `/gasto <valor> <descrição>`.
- Registrar receita: `/receita <valor> <descrição>`.
- Exibir ajuda: `/start` e `/ajuda`.
- Responder com erros compreensíveis, sem expor detalhes internos.

Funcionalidades como categorização por linguagem natural, edição/remoção via Telegram, cartões, metas e relatórios ficam para uma etapa posterior.

## Fase 1 — Fundamentos de domínio e segurança

1. Definir o modelo de autorização: cada `telegram_chat_id` deve pertencer a exatamente um usuário do aplicativo. Criar uma tabela de vínculo, por exemplo `telegram_integrations`, com `id`, `user_id`, `chat_id` (único), `username`, `ativo`, `codigo_vinculacao_hash`, `expira_em`, `created_at` e `updated_at`.
2. Criar migration, repositório e serviço de integração Telegram. O serviço deve gerar códigos temporários de vinculação e localizar o usuário por `chat_id`.
3. Expor, na área autenticada do aplicativo, a ação “Conectar Telegram”, que cria e mostra um código de uso único. O comando `/start <codigo>` consome o código e confirma o vínculo.
4. Adicionar as variáveis de ambiente documentadas em `.env.example`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` e `APP_URL`. Nunca registrar o token nem o conteúdo integral de atualizações recebidas.
5. Proteger o webhook com o cabeçalho `X-Telegram-Bot-Api-Secret-Token`, comparado de forma segura ao segredo configurado. Retornar sucesso para atualizações duplicadas, mas impedir o reprocessamento por `update_id` (persistido ou com mecanismo idempotente).

**Critério de aceite:** chat não vinculado não acessa dados nem grava lançamentos; atualizações sem segredo válido são recusadas.

## Fase 2 — Correção da base do bot

1. Ajustar `src/backend/bot/instance.js` para falhar de maneira explícita se o token estiver ausente em produção e configurar `handlerTimeout`/tratamento de erros compatíveis com ambiente serverless.
2. Tornar `setupBot` idempotente: registrar handlers uma única vez por instância de processo, sem acumular listeners a cada chamada da rota.
3. Converter todos os handlers em `async` e aplicar `await` a `DashboardService.carregarDados`, `GastosVariaveisService.criar` e `ReceitasService.criar`.
4. Unificar módulos CommonJS e ES Modules nas importações do bot. Confirmar que os exports dos serviços são carregados corretamente pelo runtime do Next.js.
5. Criar um utilitário único para mês corrente no fuso `America/Sao_Paulo`, retornando o formato de domínio já adotado pelo sistema, como `Outubro2026`. Remover `MES_ATUAL` estático.
6. Normalizar valores monetários brasileiros: aceitar `50`, `50,25`, `1.250,25` e rejeitar zero, negativos, valores ambíguos e descrições vazias.
7. Reutilizar schemas/validações de domínio — ou extrair uma camada de DTO compartilhada — para que o bot não contorne regras das APIs existentes.

**Critério de aceite:** os três comandos operam de forma assíncrona, usam o mês correto e não criam registros inválidos ou duplicados em caso de retry do Telegram.

## Fase 3 — Implementação dos comandos MVP

1. `/start [codigo]`: apresentar ajuda quando não houver código; vincular o chat e confirmar a conta quando o código for válido.
2. `/ajuda`: listar sintaxe, exemplos e limitações.
3. `/resumo`: exigir vínculo, consultar os dados do usuário no mês corrente e enviar receitas, gastos fixos, gastos variáveis e saldo em formato monetário brasileiro. Confirmar se o modelo atual já possui isolamento por usuário; caso não possua, esse isolamento é pré-requisito antes da publicação.
4. `/gasto <valor> <descrição>`: validar, registrar como `Pago`, categoria padrão `Outros` e responder com valor, descrição e mês. Manter a operação idempotente usando a identidade da mensagem (chat e message id), caso seja necessário reentregar a atualização.
5. `/receita <valor> <descrição>`: mesmo comportamento, com situação `Recebido`.
6. Adicionar fallback para comando desconhecido e tratamento centralizado de exceções do Telegraf. Erros internos devem ser registrados com contexto mínimo e devolver uma mensagem genérica ao usuário.

**Critério de aceite:** um usuário vinculado consegue executar todos os comandos e visualiza no aplicativo os lançamentos criados pelo bot.

## Fase 4 — Testes e qualidade

1. Testes unitários para parser monetário, cálculo do mês no fuso brasileiro, autorização e idempotência.
2. Testes de handlers com atualizações simuladas do Telegram: chat não vinculado, código expirado, comandos válidos, inválidos e erro dos serviços.
3. Testes de integração para webhook: segredo ausente/inválido, payload válido e redelivery de `update_id`.
4. Executar `npm run lint` e `npm run build`; acrescentar script de testes ao `package.json` conforme a ferramenta escolhida pelo projeto.

**Critério de aceite:** testes cobrem os fluxos críticos e build/lint finalizam sem erro.

## Fase 5 — Operação e publicação

1. Criar endpoint ou script administrativo autenticado para registrar/substituir o webhook usando `setWebhook`, com URL `https://<dominio>/api/bot/webhook`, segredo e `allowed_updates: ['message']`.
2. Em desenvolvimento, usar túnel HTTPS e configurar o webhook temporário; em produção, configurar a URL pública definitiva e segredos no provedor de hospedagem.
3. Validar com `getWebhookInfo`, testar `/start`, `/resumo`, `/gasto` e `/receita` em uma conta de homologação e verificar os registros no banco.
4. Configurar logs estruturados e alerta para erros consecutivos do webhook, sem armazenar token, código de vínculo ou dados desnecessários de mensagens.
5. Documentar instalação, variáveis de ambiente, configuração local, configuração de produção, rotação de token e procedimento de desativação (`deleteWebhook`).

## Ordem recomendada de execução

1. Confirmar/implementar isolamento dos dados por usuário.
2. Implementar vínculo Telegram–usuário e proteção do webhook.
3. Corrigir a infraestrutura e os handlers existentes.
4. Implementar e testar comandos MVP.
5. Configurar webhook de homologação e realizar teste ponta a ponta.
6. Publicar, monitorar e documentar a operação.

## Decisões pendentes

- Confirmar se o aplicativo já suporta múltiplos usuários no banco. Sem esse isolamento, o bot deve permanecer restrito a ambiente local/homologação.
- Definir se gastos e receitas enviados pelo Telegram devem nascer como pagos/recebidos (proposta do MVP) ou pendentes.
- Definir a estratégia de categorização: padrão `Outros` no MVP ou comando com categoria explícita em uma segunda versão.
