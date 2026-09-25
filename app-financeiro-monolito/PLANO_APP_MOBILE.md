# Plano — Aplicação mobile financeira

## Objetivo

Criar um aplicativo mobile para iOS e Android que consuma a API existente deste monólito. O app será uma nova interface; regras financeiras, persistência e cálculos continuarão centralizados no backend atual.

## Decisões propostas

- **Framework:** Expo + React Native + TypeScript, por compartilhar React com o front atual e simplificar distribuição Android/iOS.
- **Navegação:** Expo Router, com abas para as áreas principais e telas modais para criação e edição.
- **Dados remotos:** TanStack Query para cache, invalidação e estados de carregamento/erro.
- **Formulários:** React Hook Form + Zod, reutilizando as validações de negócio da API como referência.
- **Sessão:** token JWT no armazenamento seguro do dispositivo (`expo-secure-store`), nunca em armazenamento comum.
- **Publicação da API:** monólito hospedado em HTTPS, com variável `EXPO_PUBLIC_API_URL` apontando para sua URL pública.

## Escopo do MVP

1. Login por senha e persistência segura da sessão.
2. Visão geral mensal: saldo, receitas, gastos fixos, gastos variáveis e metas.
3. Gastos fixos e variáveis: listar, criar, editar, excluir e marcar como pago.
4. Receitas: listar, criar, editar, excluir e marcar como recebida.
5. Formas de pagamento e categorias carregadas por `/api/configuracoes`.
6. Seletor de mês e feedbacks de carregamento, sucesso e erro.

Itens para a segunda versão: cartões, investimentos/cotações, relatórios, metas detalhadas, financiamentos, exportação e notificações de vencimento.

## Arquitetura

```text
Aplicativo Expo (iOS / Android)
  ├── UI, navegação, formulários e cache local
  ├── SecureStore: JWT
  └── cliente HTTP autenticado
             │ HTTPS + Authorization: Bearer <JWT>
             ▼
Monólito Next.js
  ├── /api/auth/login
  ├── /api/dashboard, /api/configuracoes
  ├── /api/gastos-fixos, /api/gastos-variaveis, /api/receitas
  └── demais módulos financeiros
             ▼
          PostgreSQL
```

## Adequações necessárias no monólito

1. **Contrato de API:** documentar rotas, payloads, códigos de erro e campos de cada recurso em OpenAPI. O formato atual `{ success, data, error }` deve ser mantido.
2. **Proteção uniforme:** aplicar `withAuth` a todas as rotas financeiras e administrativas; login e webhook permanecem públicos apenas quando necessário.
3. **CORS:** permitir somente os domínios de desenvolvimento e produção do app mobile se a API estiver em domínio separado.
4. **Erros e expiração:** retornar `401` consistente para token inválido/expirado; o app então limpa a sessão e volta ao login.
5. **Ambientes:** configurar URL pública HTTPS, `JWT_SECRET`, banco de produção, logs e monitoramento. A API local não poderá ser acessada pelo celular físico sem rede/túnel durante desenvolvimento.
6. **Autorização futura:** hoje o login é por senha única. Antes de suportar vários usuários, incluir usuário no banco e filtrar todas as consultas por `userId` do JWT.

## Estrutura sugerida para o novo repositório

```text
financeiro-mobile/
  app/                    # rotas Expo Router
    (auth)/login.tsx
    (tabs)/inicio.tsx
    (tabs)/lancamentos.tsx
    gastos/[id].tsx
  src/
    api/                  # cliente HTTP e endpoints por domínio
    components/           # componentes reutilizáveis
    features/             # dashboard, gastos, receitas, configurações
    hooks/                # queries e mutations
    storage/              # token seguro
    types/                # contratos da API
  .env.example
```

## Cronograma de entrega

| Fase | Entrega | Critério de aceite |
| --- | --- | --- |
| 0 — Preparação | OpenAPI, autenticação/CORS revisados e ambiente de homologação | App de teste autentica e lê `/api/dashboard` via HTTPS |
| 1 — Fundação | Projeto Expo, tema, navegação, login e cliente autenticado | Sessão persiste ao fechar/reabrir o app e expira corretamente |
| 2 — MVP financeiro | Dashboard, mês, gastos e receitas com CRUD | Lançamentos feitos no celular aparecem no web e vice-versa |
| 3 — Qualidade | Validações, cache, estados vazios, acessibilidade e testes | Fluxos críticos passam em Android e iOS |
| 4 — Expansão | Metas, cartões, investimentos, relatórios e financiamentos | Funcionalidades priorizadas entregues incrementalmente |
| 5 — Publicação | Ícones, política de privacidade, builds e lojas | Builds distribuídos por TestFlight e Play Console |

## Backlog técnico inicial

- Criar `apiClient` com URL configurável, `Authorization` automático e tratamento de `401`.
- Tipar as respostas comuns da API e os recursos do MVP.
- Implementar queries para dashboard/configurações e mutations para lançamentos/status.
- Criar componentes de moeda, data, seletor de mês, categoria, forma de pagamento e confirmação de exclusão.
- Usar atualização otimista apenas para alternar status; usar invalidação de query após CRUD inicialmente.
- Adicionar testes de unidade ao cliente/API e testes de fluxo para login e criação de gasto.
- Configurar EAS Build, Sentry (erros) e analytics somente após decisão de privacidade.

## Riscos e cuidados

- Não expor `JWT_SECRET`, senhas ou tokens de provedores de cotações no aplicativo.
- Não usar `localhost` como URL no celular físico; usar a URL HTTPS de homologação ou um túnel temporário.
- A versão inicial deve tratar falha de rede claramente. Offline completo pode ficar para uma fase posterior, pois exige fila de sincronização e tratamento de conflitos.
- Como o app e o web compartilham dados, mudanças no contrato da API devem ser versionadas ou compatíveis.

## Próximo passo recomendado

Executar a Fase 0: consolidar o contrato OpenAPI e disponibilizar o monólito em uma URL HTTPS de homologação. Em seguida, criar o projeto Expo e entregar login + dashboard como primeiro incremento validável.
