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