# Plano de separação do monólito: frontend e backend

## Objetivo

Separar o projeto `app-financeiro-monolito` em aplicações independentes de frontend web e API, **sem mudar a aparência, os fluxos nem os dados devolvidos ao usuário**. A migração será incremental: o frontend continuará consumindo os mesmos caminhos `/api/...`, os mesmos métodos HTTP e o mesmo envelope de resposta enquanto a API é extraída.

O aplicativo mobile já é um consumidor externo da API e passa a ser uma referência adicional de compatibilidade.

## Leitura do estado atual

| Área | Estado atual | Consequência para a migração |
| --- | --- | --- |
| Web | Next.js 16, uma página cliente com navegação por abas e componentes em `src/pages_components` | Pode ser movido quase sem alteração visual; deve preservar CSS, componentes e estado atuais. |
| API | Route Handlers do Next em `src/app/api`, com JWT em `src/proxy.js` | Os handlers são a fronteira a preservar inicialmente. |
| Domínio | Serviços, repositórios e schemas em `src/backend/modules` | Já existe uma separação interna aproveitável pela futura API. |
| Dados | PostgreSQL/Supabase, Prisma e migrations | Banco e schema não precisam ser migrados nesta separação. |
| Clientes | `src/utils/apiService.js` no web e `financeiro-mobile/src/lib/api.ts` no mobile | As duas camadas devem passar a usar uma URL configurável, sem alterar suas interfaces públicas. |

## Arquitetura-alvo

```text
financeiro-web (Next.js) ── HTTPS/JWT ──> financeiro-api (Node.js + rotas REST) ──> PostgreSQL
          │                                        │
          └──── mesma interface atual              ├── Telegram webhook
                                                   ├── BCB/cotações
financeiro-mobile (Expo) ── HTTPS/JWT ────────────┘
```

Estrutura sugerida, inicialmente em um único repositório para reduzir risco operacional:

```text
app-financeiro/
  apps/
    web/                 # interface Next.js atual
    api/                 # servidor HTTP independente
  financeiro-api/
    src/domain/          # serviços e cálculos de domínio da API
  prisma/                # schema e migrations existentes
  financeiro-mobile/     # permanece cliente da API
```

Um monorepo é recomendado nesta primeira etapa porque permite migrar código sem cópias, versionar frontend/API juntos e publicar cada aplicação separadamente. A divisão em repositórios distintos pode acontecer depois que os contratos estiverem estáveis.

## Contrato de compatibilidade (não negociável durante a migração)

1. Manter todos os endpoints existentes, por exemplo `POST /api/auth/login`, `GET /api/dashboard?mes=...` e os CRUDs de gastos, receitas, metas, investimentos, orçamentos, cartões, configurações, relatórios e financiamentos.
2. Manter o envelope `{ success, data, error }`, status HTTP, nomes de campos e regras de normalização atuais (incluindo `snake_case`/`camelCase`).
3. Manter autenticação `Authorization: Bearer <JWT>`, algoritmo/claims/expiração e o comportamento de `401` atual.
4. Manter efeitos de negócio: recorrências, séries, parcelas, atualização de status, cálculos de financiamento, cotações e exportação.
5. Não alterar o banco, migrations ou dados como parte da extração. Qualquer evolução de schema deve ser uma entrega separada.
6. Preservar `https://web-dominio/api/...` via proxy/rewrite até todos os clientes apontarem diretamente para `https://api-dominio`.

## Fases de execução

### 0. Linha de base e proteção contra regressão

Antes de extrair qualquer código:

- Inventariar endpoint, método, autenticação, entrada, saída e efeitos colaterais em um catálogo versionado (OpenAPI é a fonte recomendada).
- Registrar respostas reais anonimizadas para cada endpoint e criar testes de contrato para elas.
- Criar testes de jornada para login, dashboard, inclusão/edição/exclusão, alteração de status, recorrências e financiamento.
- Capturar telas de referência das 10 abas web em desktop e mobile para comparação visual.
- Corrigir somente problemas que bloqueiem testes; não combinar refatorações visuais com esta iniciativa.

Critério de saída: o comportamento atual está mensurado por testes e snapshots, e cada rota possui dono e contrato documentado.

### 1. Preparar fronteiras sem mudar a execução

- Manter schemas, tipos de payload e regras de negócio dentro de `financeiro-api`, próximos aos seus consumidores.
- Mover `src/backend/modules`, `lib/calculadora`, `lib/bcb`, middlewares e utilitários para `financeiro-api/src` mantendo exportações compatíveis.
- Padronizar uma única função de resposta/erro na API, mas com a mesma estrutura JSON já consumida pelos clientes.
- Tornar configurável a origem da API no web: `NEXT_PUBLIC_API_URL`. Valor vazio mantém chamadas relativas no ambiente atual; valor preenchido atende API externa.
- Manter `src/utils/apiService.js` como adaptador, sem renomear suas funções nem tocar nos componentes de página.

Critério de saída: o monólito continua executando e os testes de contrato/fluxos passam sem mudança perceptível.

### 2. Criar a API independente em paralelo

- Criar `apps/api` com runtime Node e rotas REST que reproduzem os handlers atuais, inicialmente sem redesenhar a API.
- Reutilizar diretamente `financeiro-api/src/domain` e `prisma`; somente controllers/transportes ficam no limite HTTP da API.
- Implementar CORS com allowlist dos domínios web e mobile, `Authorization` e `Content-Type`; não usar `*` em produção.
- Transportar autenticação JWT, webhook do Telegram, exportação e integração com BCB, com variáveis de ambiente próprias.
- Adicionar `/health` e `/ready` sem autenticação, logs estruturados com `requestId` e sem gravar tokens ou senhas.
- Publicar OpenAPI e validar request/response no limite HTTP.

Critério de saída: a nova API, contra uma base de homologação, responde igual à API do Next para a suíte de contratos.

### 3. Troca controlada de tráfego

1. Publicar `apps/api` em homologação e apontar um ambiente web de homologação a ela.
2. Executar testes end-to-end web e mobile, além de comparação automática das respostas da API antiga e nova para os mesmos cenários.
3. Em produção, configurar no frontend um rewrite/proxy de `/api/:path*` para a nova API. Assim, o navegador e a interface continuam usando os mesmos caminhos relativos e não percebem a troca.
4. Monitorar erros 4xx/5xx, latência e divergências por um período acordado. Ter rollback instantâneo alterando somente o destino do proxy.
5. Quando estabilizado, permitir que o mobile use o domínio da API diretamente (ele já suporta isso por `EXPO_PUBLIC_API_URL`).

Critério de saída: a nova API atende 100% do tráfego; não há alteração de interface ou regressão funcional conhecida.

### 4. Extrair e simplificar o frontend

- Mover `src/app`, `src/components`, `src/pages_components`, `src/hooks`, `src/utils` e estilos para `frontend` preservando estrutura visual e classes CSS.
- Substituir a proteção de API em `proxy.js` pela proteção no servidor da API; manter no web apenas guardas necessários à navegação/tela.
- Centralizar a configuração de ambiente em `NEXT_PUBLIC_API_URL`; remover dependências de Prisma, JWT, banco e bibliotecas de backend do `package.json` do web.
- Manter o `apiService` como fachada para evitar que páginas conheçam URL, token ou formato HTTP.

Critério de saída: build e deploy do web não possuem credenciais de banco, Prisma ou segredo JWT, e a comparação visual não apresenta diferenças aprovadas.

### 5. Desativação segura do monólito

- Remover os Route Handlers de `frontend` apenas após o período de estabilização e rollback expirar.
- Remover dependências e variáveis exclusivas do backend do frontend.
- Atualizar CI/CD, documentação operacional, alertas e backup/rollback.
- Opcionalmente, separar o monorepo em repositórios apenas se houver necessidade organizacional clara.

## Ordem recomendada dos módulos da API

| Onda | Módulos | Motivo |
| --- | --- | --- |
| 1 | Auth, configurações, dashboard, gastos fixos, gastos variáveis, receitas | Alto uso e fluxos relativamente diretos; valida a base de JWT, erros e banco. |
| 2 | Metas, orçamentos, cartões, relatórios, exportação | Dependem dos dados financeiros, mas têm menor complexidade operacional. |
| 3 | Investimentos e cotações | Possuem integração externa/cache e exigem observabilidade adicional. |
| 4 | Financiamentos, amortizações, pagamentos, índices e simulador | Maior concentração de regras e cálculos; migrar após a infraestrutura estar comprovada. |
| 5 | Bot/webhook Telegram | Exige URL pública, segredo e idempotência; pode operar em paralelo até o corte final. |

## Variáveis de ambiente

| Aplicação | Variáveis principais |
| --- | --- |
| API | `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AUTH_PASSWORD_HASH`, `AUTH_USER`, credenciais do Telegram/BCB e `CORS_ORIGINS` |
| Web | `NEXT_PUBLIC_API_URL` (vazio para proxy relativo; domínio da API quando direto) |
| Mobile | `EXPO_PUBLIC_API_URL` |

Segredos ficam somente na API e no provedor de deploy. Nem `JWT_SECRET`, nem `DATABASE_URL`, nem hash de senha devem chegar ao bundle do web ou mobile.

## Qualidade, segurança e observabilidade

- Testes unitários para serviços de domínio, sobretudo recorrências e cálculos de financiamento.
- Testes de integração contra PostgreSQL para repositórios e migrations.
- Testes de contrato para cada endpoint, executados tanto contra o handler antigo quanto contra a API nova durante a migração.
- Testes E2E e regressão visual para as abas: Visão Geral, Gastos Fixos/Variáveis, Receitas, Metas, Relatórios, Investimentos, Configurações, Financiamentos e Simulador de Aportes.
- Health checks, métricas de latência/erro, logs com correlação e alertas em produção.
- Rate limit no login e webhook, CORS restritivo, HTTPS e rotação planejada do segredo JWT.

## Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Divergência de payload/campos | OpenAPI, testes de contrato e manutenção do adaptador `apiService`. |
| CORS quebra o web/mobile | Usar proxy relativo no web no corte inicial e allowlist explícita para o mobile. |
| JWT incompatível invalida sessões | Compartilhar temporariamente o mesmo `JWT_SECRET`, claims e expiração; planejar rotação após estabilização. |
| Regras de recorrência são acionadas em leitura | Testes de integração idempotentes e monitoramento de inserções duplicadas. |
| Corte interrompe usuários | Canary + proxy reversível; rollback é trocar o destino, sem redeploy do frontend. |
| Frontend recebe segredos | Separação de envs e validação de build/CI. |

## Definição de pronto

A separação estará concluída quando o frontend e API forem implantáveis de forma independente; o frontend não tiver acesso ao banco nem segredos; web e mobile consumirem a API separada; a suíte de contratos e jornadas críticas passar; e a interface/funções forem visual e funcionalmente equivalentes às da linha de base.
