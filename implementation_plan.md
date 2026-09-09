# Integração do módulo de Amortização ao App Financeiro Monolito

O `app-financeiro-monolito` é a aplicação principal, utilizando PostgreSQL e um sistema de autenticação próprio de inquilino único (Single-tenant, JWT com hash no `.env`).
O `app-amortização` é um app isolado em SQLite e que usa Next-Auth (Multi-tenant).

Para integrarmos sem perder funcionalidade ou qualidade de código de ambas as partes, e para não quebrar a aplicação principal, adotaremos a abordagem de **assimilar o app-amortização às convenções do monolito**.

## ⚠️ User Review Required

- **Autenticação:** O plano propõe **remover o Next-Auth** do módulo de amortização e adaptá-lo ao sistema de login atual do seu monolito (Single-tenant). O modelo `Financiamento` não precisará mais ser linkado a um `User` no banco de dados. Você concorda com essa adaptação?
- **Banco de Dados:** Os novos modelos (Financiamento, Parcela, Amortização Extra, Índices BACEN) serão migrados para o **PostgreSQL** do monolito. Você aprova a execução dessa migração?

## Open Questions

- Você deseja que a pasta original `app-amortização/` seja deletada após a conclusão da migração ou mantida como backup por segurança?

---

## Proposed Changes

### Fase 1: Banco de Dados (Prisma) e Dependências

Nesta fase vamos unificar o banco de dados e instalar pacotes necessários.

#### [MODIFY] [schema.prisma](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/prisma/schema.prisma)
- Mover os modelos `Financiamento`, `ParcelaPaga`, `AmortizacaoExtra` e `IndiceBCBCache` do `app-amortização` para o schema do monolito.
- Remover os campos de amarração com `NextAuth` (`userId`, referências a `User`).
- Adequar nomes de tabelas usando o padrão `@@map("...")` existente no monolito.
- Rodar a migration no PostgreSQL.

#### [MODIFY] [package.json](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/package.json)
- Instalar dependências que o app-amortização usa e o monolito não tem: `@tanstack/react-table`, `date-fns`, `lucide-react` (se aplicável), e `next-themes` (se ainda não estiver instalado no monolito).

---

### Fase 2: Motor de Cálculo e Lógica de Negócio (Backend)

Migraremos toda a lógica pesada de cálculo financeiro e rotas da API.

#### [NEW] [src/backend/lib/calculadora](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/backend/lib/calculadora)
- Copiar o motor de Price, SAC e TR puro (sem NextJS/Prisma), adaptando os imports.

#### [NEW] [src/backend/modules/financiamentos](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/backend/modules/financiamentos)
- Criar a estrutura `controller`, `service`, `repository` e `schema` seguindo o padrão já adotado no monolito para Gastos, Receitas, etc.
- As consultas ao banco agora ignorarão o `userId` (já que há apenas um usuário).

#### [NEW] [src/app/api/financiamentos](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/app/api/financiamentos)
- Construir as rotas REST (`route.js`) enlaçadas pelo middleware customizado do monolito `withAuth`, em vez de `auth()` do NextAuth.

---

### Fase 3: Integração do Frontend (Componentes e Serviços)

O código visual será mesclado, preservando a identidade visual.

#### [MODIFY] [src/utils/apiService.js](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/utils/apiService.js)
- Estender o arquivo adicionando funções HTTP correspondentes às novas rotas de financiamento (`addFinanciamento`, `getFinanciamentos`, `simularAmortizacao`, etc).

#### [NEW] [src/pages_components/financiamentos](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/pages_components/financiamentos)
- Trazer a `TabelaClient`, `DashboardClient`, `GraficoEconomia`, `SimuladorClient` e modais, isolando-os numa pasta separada para evitar conflitos com os componentes atuais.
- Substituir o uso da API antiga (`app-amortização/frontend/lib/api.ts`) pelas chamadas recém-criadas no `apiService.js`.

#### [NEW] [src/app/(dashboard)/financiamentos](file:///c:/Users/trib-dev1/Desktop/Farias/Projetos/app-financeiro-monolito/src/app/(dashboard)/financiamentos)
- Criar a página de rota principal e a página de ferramentas de simulação.
- Estas páginas renderizarão os componentes que trouxemos na etapa anterior.

#### [MODIFY] Barra lateral e roteamento
- Adicionar no menu esquerdo (Sidebar) os novos botões para **Financiamentos** e **Simulador de Aportes**.

---

### Fase 4: Polimento e Testes

- Verificar se o agendamento/busca da API do Banco Central (TR) continua funcionando.
- Validar se o Glassmorphism visual do amortização "casa" com o tema atual do monolito.
- Consertar conflitos de CSS global, caso os *utility classes* importados entrem em choque com o monolito.

## Verification Plan

### Teste de Regressão
1. Fazer login no app-financeiro (via `.env`).
2. Adicionar um Gasto/Receita normalmente para provar que a base original não quebrou.

### Teste do Novo Módulo (Amortização)
1. Navegar pela nova Sidebar para a rota de Financiamentos.
2. Adicionar os dados fictícios de um contrato da Caixa.
3. Cadastrar uma amortização extra de teste (ex: R$ 5.000,00).
4. Checar no `Dashboard` se o gráfico exibe corretamente a mudança na linha do tempo e a economia de juros gerada.
