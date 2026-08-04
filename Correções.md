# Backlog de Correções e Melhorias

Legenda de status:
- ✅ **Corrigido** — implementado e funcional
- 🔲 **Pendente** — aguardando implementação

---

## ✅ 11. Melhorias na Tela de Investimentos

**Status:** Corrigido em `22/07/2026`

**Como foi implementado:**

**Campos dinâmicos por tipo de ativo:**
O campo `"Rentabilidade (% do CDI)"` foi adicionado ao formulário de Investimento com visibilidade condicional: aparece com animação suave (`maxHeight` + `opacity`) apenas quando `tipo === "Renda Fixa"`, e fica oculto para `"Ação"`, `"FII"` e `"ETF"`. O sistema de `condicional` foi implementado de forma genérica no `Modal.jsx`, podendo ser reutilizado em outros formulários.

**Cotações em tempo real via proxy server-side:**
Um hook `useCotacoes(tickers)` foi criado no `Investimentos.jsx`. Ele chama o endpoint `/api/investimentos/cotacoes?tickers=...` a cada 5 minutos via `setInterval`. O Route Handler server-side:
- Valida os tickers com regex whitelist (`/^[A-Z]{4,6}[0-9]{0,2}$/`) para prevenir SSRF
- Lê `BRAPI_TOKEN` de `process.env` — **nunca exposto ao browser**
- Aplica cache in-memory de 10 minutos para preservar o limite gratuito de 15.000 req/mês da Brapi
- Busca o CDI diário (série 12) do Banco Central do Brasil sem autenticação
- Retorna erro gracioso — falha na API externa não derruba a interface

**Novas colunas na tabela:**
- **Cotação Atual** — preço de mercado para Ações/FIIs/ETFs; exibe "CDI" para Renda Fixa
- **Var. Dia** — variação percentual do dia (verde/vermelho) para ativos em bolsa; exibe "% CDI" para Renda Fixa
- **Resultado** — valor e percentual de ganho/perda desde o preço médio cadastrado; para Renda Fixa, calcula rendimento acumulado pela fórmula de juros compostos com o CDI diário

**Novos KPIs e widgets:**
- Card **Resultado Total** (soma de todos os resultados, com cor semântica)
- Card **Destaque do Dia** (ativo com maior variação positiva)
- Widget **CDI de Referência** no painel de alocação, exibindo a taxa anual do BCB
- Indicador de status "⚡ Atualizado às HH:MM" com botão de atualização manual

**Arquivos alterados:**
- `src/backend/database/migrations/010_investimentos_rentabilidade.sql` — migration SQL [NEW]
- `src/backend/modules/investimentos/investimentos.schema.js` — campo `rentabilidadeCdi` com validação condicional Zod
- `src/backend/modules/investimentos/investimentos.repository.js` — `INSERT`/`UPDATE` com `rentabilidade_cdi`
- `src/backend/modules/investimentos/investimentos.service.js` — mapeamento camelCase → snake_case
- `src/app/api/investimentos/cotacoes/route.js` — proxy seguro Brapi + BCB [NEW]
- `.env.example` — documentação da variável `BRAPI_TOKEN` [NEW]
- `src/components/Modal.jsx` — campo condicional `rentabilidadeCdi` com animação
- `src/pages_components/Investimentos.jsx` — hook `useCotacoes`, novas colunas, KPIs, CDI widget


Chave do brapi.dev
2hyReS3hAvcjFGsvur3eh3

---

## ✅ 12. Módulo de Cotações Persistente com Rate-Limit Brapi

**Status:** Implementado em `29/07/2026`

**Problema resolvido:**
O cache anterior era um `Map` in-memory volátil — perdido a cada restart do servidor e sem controle de consumo mensal. O token da Brapi também estava comentado no `.env`.

**Como foi implementado:**

**Banco de dados — migration `012_cotacoes_persistencia.sql`:**
- `cotacoes` — snapshot mais recente de cada ativo (PRIMARY KEY = symbol); substitui o Map in-memory
- `historico_cotacoes` — série histórica por ativo com retenção automática de 90 dias
- `controle_requisicoes` — singleton que rastreia requisições HTTP à Brapi no mês; auto-reseta no dia 1

**Repository (`src/backend/modules/cotacoes/cotacoes.repository.js`):**
- `getControleRequisicoes()` — retorna estado do contador com auto-reset se mês mudou
- `incrementarRequisicoes(n)` — incrementa 1 por chamada HTTP (independente de quantos tickers)
- `getCotacaoRecente(symbol, ttlMin=15)` — cache hit se salvo dentro de 15 min
- `getCotacaoFallback(symbol)` — dado mais recente disponível (usado quando limite é atingido)
- `upsertCotacao` / `salvarHistorico` — persistência após cada fetch bem-sucedido da Brapi

**Lógica de rate-limit no route handler:**
1. Verifica `controle_requisicoes` — se mês mudou, auto-reset do contador
2. Se `total >= 15.000` → serve dados do SQLite com flag `limiteMensalAtingido: true` (sem chamar Brapi)
3. Para cada ticker: verifica cache SQLite (TTL 15 min) antes de qualquer fetch externo
4. Apenas tickers sem cache válido vão para a Brapi; incrementa contador em 1 por chamada HTTP
5. Resposta inclui `meta: { requisicoesMes, limiteMaximo, limiteMensalAtingido, dadosDesatualizados, fonteDados }`

**Novas rotas:**
- `GET /api/investimentos/cotacoes/stats` — retorna apenas o estado do contador (sem disparar fetch)
- `GET /api/investimentos/cotacoes/historico?symbol=PETR4&limit=30` — série histórica do ativo

**Interface (`Investimentos.jsx`):**
- `RateLimitBar`: barra de progresso colorida no cabeçalho da tabela
  - 🟢 Verde < 80% → 🟡 Amarelo 80–99% → 🔴 Vermelho ≥ 100%
  - Exibe: `3.240 / 15.000 req/mês`
  - Aviso quando limite atingido: `⚠️ Dados de DD/MM HH:MM · limite mensal atingido`

**Arquivos:**
- `src/backend/database/migrations/012_cotacoes_persistencia.sql` [NEW]
- `src/backend/modules/cotacoes/cotacoes.repository.js` [NEW]
- `src/app/api/investimentos/cotacoes/route.js` [REFATORADO]
- `src/app/api/investimentos/cotacoes/stats/route.js` [NEW]
- `src/app/api/investimentos/cotacoes/historico/route.js` [NEW]
- `src/pages_components/Investimentos.jsx` [ATUALIZADO]
- `.env` — `BRAPI_TOKEN` ativado

---

## ✅ 13. Correção: Módulo de Configurações sem dados (tabela vazia)

**Status:** Corrigido em `29/07/2026`

**Causa raiz:**
A migration `007_configuracoes_sistema.sql` usava `INSERT OR IGNORE`, que falha silenciosamente se a tabela já existir sem dados (condição de corrida no runner de migrations). A tabela `configuracoes` foi criada mas ficou com **0 registros**, fazendo a tela de Configurações exibir "Nenhum item cadastrado" em todas as seções.

Adicionalmente, os dados iniciais da `007` tinham as categorias de Gastos Fixos e Gastos Variáveis **trocadas** entre si.

**Solução:**
Migration `013_configuracoes_seed_fix.sql` com `INSERT OR REPLACE` (garante escrita mesmo que a chave já exista) e com as categorias corretas:
- `categorias_receitas` → `["Trabalho","Apartamento","Outros","Mãe"]`
- `categorias_gastos_fixos` → `["Educação","Veiculo","Casa","Apartamento","Lazer","Outros","Saúde","Mãe"]`
- `categorias_gastos_variaveis` → `["Casa","Alimentação","Transporte","Lazer","Saúde","Vestuário","Outros","Mãe"]`
- `formas_pagamento` → `["Cartão Inter","Cartão Nubank","Débito","Pix"]`

**Arquivos:**
- `src/backend/database/migrations/013_configuracoes_seed_fix.sql` [NEW]
