# Registro de Alterações (Log)

Este arquivo documenta todas as alterações, implementações e correções realizadas pela Inteligência Artificial neste repositório. O objetivo é manter um histórico detalhado e fornecer contexto contínuo para interações futuras.

## [2026-07-29] - Planejamento e Estruturação Inicial
- **Implementação:** Criação do arquivo `log.md` para registro contínuo do contexto da aplicação.
- **Planejamento:** Elaboração do plano de execução para o arquivo `melhorias.md`, dividido em 4 fases de desenvolvimento, visando abranger novas funcionalidades, melhorias analíticas, arquiteturais e de experiência do usuário.

## [2026-07-29] - Execução da Fase 0 (Design System & Glassmorphism)
- **Implementação:** Alteração da fonte principal no `app/layout.tsx` de `Inter` para `Outfit` para um visual mais geométrico.
- **Implementação:** Substituição das variáveis CSS no `app/globals.css` para aplicar o tema do Intercom (Creme, Ink, Fin Orange).
- **Implementação:** Refatoração das classes `.card`, `.metric-card` e `.header` para implementarem fundos translúcidos e efeito `backdrop-filter: blur`, introduzindo o estilo Glassmorphism.
- **Implementação:** Modificação dos botões `.btn-primary` para usarem a cor de destaque Fin Orange.
- **Implementação:** Adicionado suporte nativo e um botão de alternância (toggle) para Modo Escuro utilizando a biblioteca `next-themes`. As variáveis CSS do `[data-theme='dark']` foram construídas de forma a manter o Glassmorphism legível mesmo em fundos pretos/carvão.

## [2026-07-29] - Execução da Fase 1 (Arquitetura Core e Projeções)
- **Implementação:** Refatorada a engine de cálculo no `backend/lib/calculadora/price.ts`, transformando a dependência de TR fixa para índices de correção genéricos, preparando abstração para IPCA ou INCC.
- **Implementação:** Expandida a função `simularAmortizacaoExtra` no backend para retornar as datas de quitação Originais e Projetadas.
- **Teste:** Criado script de cobertura `price.test.ts` usando Node Test Runner, garantindo o funcionamento do cálculo do PMT com amortização extra. (Passou em 100%).
- **Implementação:** Dashboard (`page.tsx` e `DashboardClient.tsx`) refatorado para processar as duas linhas do tempo (Teórica vs Real) e apresentar no cartão de progresso a "Projeção de Quitação", calculando exatos quantos meses de antecipação o usuário já conquistou.

## [2026-07-29] - Execução da Fase 2 (Visualizações e Analíticas Avançadas)
- **Implementação:** Construído o componente `GraficoEconomia.tsx` integrando um gráfico de Área Empilhada do `recharts` que exibe visualmente o "Capital Amortizado (Verde)" vs "Juros Pagos (Vermelho)" acumulados ao longo do tempo.
- **Implementação:** Integrado o Gráfico de Economia na view do Dashboard, ao lado do histórico da Taxa Referencial.
- **Implementação:** Desenvolvido componente `DetalhesParcela.tsx`, um modal flutuante contendo um gráfico de Pizza (PieChart) detalhando a composição matemática exata (Juros, Seguro, Amortização e Correção) de uma parcela específica.
- **Implementação:** Tabela de Amortização (TabelaClient) atualizada para tornar cada linha clicável (`hover:bg-hover`), acionando a abertura do modal de Detalhes da Parcela correspondente.

## [2026-07-29] - Execução da Fase 3 (Ferramentas do Usuário e Retenção)
- **Implementação:** Desenvolvida a rota `/ferramentas/calculadora-reversa` que atua como um assistente de Metas. A rota é um *Server Component* que alimenta o *Client* com os dados reais do banco (`saldoDevedorAtual`, `prazoRestante`, `taxaJuros`).
- **Implementação:** Criada matemática reversa `CalculadoraReversaClient.tsx`. Possui dois modos de atuação.
  1. *Tempo Alvo:* Descobre a nova PMT exata (islando a variável PMT na fórmula da Tabela Price) se o cliente quiser quitar o imóvel em "N" meses.
  2. *Aporte Fixo:* Utiliza logaritmo para calcular "N" (Prazo), dado que o cliente deseja injetar um valor fixo (E) a mais por mês. Retorna "insuficiente" se o aporte não cobrir os juros do mês.
- **Integração:** Adicionado link da Calculadora Reversa ao Menu Principal lateral (`Sidebar.tsx`).

## [2026-07-29] - Execução da Fase 4 (Polimento Final, PWA e Alertas)
- **Implementação (UI):** Adicionado `body::before` e `body::after` em `globals.css` com blobs flutuantes dinâmicos para tornar o efeito `backdrop-filter: blur(16px)` perceptível e resolver problemas de visualização de contraste no *Dark Theme*. Ativado Blur na Sidebar.
- **Implementação (PWA):** Criado `public/manifest.json` para definir cores base e transformado a aplicação num Progressive Web App (PWA), instalável em Desktop/Mobile com ícones de máscara padrão. Injetado `themeColor` e `manifest` direto no `layout.tsx`.
- **Implementação (Notificações):** Criado um serviço reativo de alerta no `DashboardClient`. Caso o último índice registrado da TR seja superior ao anterior, a aplicação injeta dinamicamente um *Banner de Warning* alertando o usuário sobre o "Impacto Fantasma" e incentivando o uso do Simulador de Aportes.

## [2026-07-31] - Correções de Estrutura e Funcionalidade

### 🔴 Críticos

- **Correção (viewport):** `themeColor` movido do objeto `Metadata` (deprecated no Next.js 14+) para a exportação `viewport` no `app/layout.tsx`, seguindo a API atual da documentação oficial. Agora suporta variantes `light`/`dark`.
- **Correção (fontes):** Removido `@import` do Google Fonts no `globals.css` que conflitava com o Next.js Font (`next/font/google`). Corrigida a variável `--font-sans` que sobrescrevia `'Inter'` hardcoded em vez de usar a variável CSS injetada pelo `Outfit` configurado no layout.
- **Correção (CSS):** Adicionadas +200 utility classes faltantes no `globals.css` que eram usadas nos componentes mas não tinham definição: `text-xs`, `text-sm`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `rounded-*`, `p-*`, `m-*`, `grid-cols-*`, `flex-*`, `justify-*`, `items-*`, `overflow-*`, `opacity-*`, `transition-*`, `bg-*` com opacidade (ex: `bg-success/10`), `border-*` com opacidade, `hover:*`, `group-hover:*`, `backdrop-blur-sm`, `sm:*`, `md:*` (breakpoints responsivos), entre outras.
- **Refatoração (Simulador):** Página `/simulador` completamente refatorada. Era um `'use client'` com **dados mockados** que usava cálculos fictícios (`economiaJuros: valorAporte * 1.5`). Agora é um *Server Component* que busca os dados reais do banco e repassa para o novo `SimuladorClient.tsx`. O client usa o motor real `simularAmortizacaoExtra` com **cálculo em tempo real** a cada mudança de input, sem necessidade de botão "Simular". Exibe também o ROI do aporte e as datas projetadas de quitação.

### 🟡 Importantes

- **Correção (Sidebar):** Corrigido ícone duplicado `Calculator` — "Calculadora Reversa" agora usa o ícone `Target`. Nav items reorganizados em dois grupos: **Menu Principal** e **Ferramentas**, com seção **Conta** (Configurações) preservada.
- **Funcionalidade (Mobile):** Adicionado botão hambúrguer no `Header.tsx` (visível apenas em mobile via `#sidebar-toggle { display: flex }`). `AppLayout` convertido para `'use client'` para gerenciar estado `sidebarOpen`. `Sidebar` agora aceita props `isOpen` e `onClose`, renderiza overlay de fundo semitransparente no mobile e fecha ao clicar em qualquer link de navegação.
- **Correção (TypeScript):** Erro pré-existente no `DetalhesParcela.tsx` — formatter do `recharts Tooltip` com tipo incompatível corrigido de `(value: number)` para `(value) => formatBRL(Number(value) || 0)`. Build com **0 erros**.

