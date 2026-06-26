# 📊 Análise de Funcionalidades — Mercado de Apps Financeiros

> Estudo baseado em **Mobills**, **Organizze** e tendências do mercado brasileiro (2025–2026).  
> Objetivo: identificar funcionalidades implementáveis no **App Financeiro Monolito**.

---

## 🔍 Visão Geral dos Concorrentes

### Mobills
App robusto voltado para usuários analíticos que desejam **controle profundo e relatórios detalhados**. Destaca-se por:
- Relatórios dinâmicos e gráficos granulares
- Gestão completa de cartões de crédito (faturas, parcelas, limites)
- Criação de metas e objetivos de médio/longo prazo
- Orçamentos mensais por categoria
- Multiplataforma: Android, iOS, Web

### Organizze
App focado em **praticidade e experiência sem fricção**. Destaca-se por:
- Interface limpa, sem anúncios
- Categorização inteligente com subcategorias
- Alertas de limites de gastos por categoria
- Previsibilidade financeira com projeção de saldo futuro
- Criptografia ponta a ponta e segurança AWS

---

## ✅ Funcionalidades Já Implementadas no App

Com base na estrutura atual do projeto (`src/app`, `src/backend/modules`):

- ✅ Lançamento manual de gastos variáveis
- ✅ Autenticação JWT
- ✅ Open Finance com Pluggy (em planejamento — ver `implementacao-openfinance.md`)
- ✅ Armazenamento local com SQLite

---

## 🚀 Funcionalidades a Implementar

Organizadas por **prioridade e complexidade**, com referência ao concorrente que inspira cada ponto.

---

### 🔴 Prioridade Alta — Fundação de Controle Financeiro

#### 1. Orçamentos Mensais por Categoria
**Inspirado em:** Mobills e Organizze  
**O que é:** O usuário define um limite de gasto mensal para cada categoria (ex: "Alimentação → R$ 800/mês").  
**Valor:** Funcionalidade mais básica e mais impactante para disciplina financeira. Transforma o app de "registro" para "controle".

**Como implementar:**
- Nova tabela `orcamentos` no SQLite: `(id, categoria, valor_limite, mes, ano, usuario_id)`
- API REST: `GET/POST/PUT /api/orcamentos`
- UI: Card com barra de progresso por categoria (gasto atual vs. limite)
- Cálculo automático: soma dos `gastos_variaveis` da categoria no mês vs. limite definido

---

#### 2. Alertas de Gastos por Limite de Categoria
**Inspirado em:** Mobills e Organizze  
**O que é:** Notificação/alerta visual quando o usuário atingir 80% ou 100% do orçamento de uma categoria.

**Como implementar:**
- Lógica no service de gastos: ao criar/editar um gasto, verificar se ultrapassa o threshold
- Notificação in-app via toast/banner com destaque visual
- Futuramente: notificação push (PWA) ou e-mail

---

#### 3. Dashboard com Resumo Financeiro
**Inspirado em:** Mobills  
**O que é:** Tela inicial com visão consolidada: saldo do mês, total de gastos, total de receitas, categorias com mais gasto, alertas de orçamento.

**Como implementar:**
- Nova rota `GET /api/dashboard/resumo?mes=&ano=`
- Retornar: saldo, receitas, despesas, gastos por categoria, % do orçamento consumido
- Frontend: cards de KPIs no topo + mini gráfico de pizza ou barras

---

### 🟡 Prioridade Média — Planejamento e Experiência

#### 4. Subcategorias de Gastos
**Inspirado em:** Organizze  
**O que é:** Dentro de "Alimentação", criar subcategorias como "Supermercado", "Delivery", "Restaurantes".  
**Valor:** Granularidade sem complexidade — o usuário entende exatamente para onde vai o dinheiro.

**Como implementar:**
- Adicionar campo `subcategoria` (nullable) na tabela `gastos_variaveis`
- UI: campo de texto livre ou select dinâmico baseado na categoria pai
- Relatórios agrupados por subcategoria

---

#### 5. Tags para Gastos
**Inspirado em:** Mobills  
**O que é:** Etiquetas livres adicionadas a qualquer transação (ex: `#viagem`, `#presente`, `#trabalho`).  
**Valor:** Filtros cross-categoria. Permite ver "quanto gastei em coisas de trabalho este mês" independente da categoria.

**Como implementar:**
- Tabela `gastos_tags` com relação N:N entre `gastos_variaveis` e `tags`
- Campo de input com autocomplete na UI de lançamento
- Filtro por tag nos relatórios

---

#### 6. Gestão de Cartão de Crédito (Faturas)
**Inspirado em:** Mobills  
**O que é:** Visualização da fatura do mês, controle de limite disponível, acompanhamento de gastos parcelados.

**Como implementar:**
- Tabela `cartoes_credito`: `(id, nome, limite_total, dia_fechamento, dia_vencimento)`
- Tabela `parcelas`: `(id, gasto_id, numero_parcela, total_parcelas, valor_parcela)`
- API: `GET /api/cartoes/:id/fatura?mes=&ano=` — agrupa gastos do cartão no período
- UI: Card de cartão com limite usado/disponível e lista de lançamentos da fatura

---

#### 7. Metas de Economia / Objetivos
**Inspirado em:** Mobills  
**O que é:** O usuário cria uma meta com valor alvo e prazo (ex: "Viagem — R$ 5.000 até dezembro/2025"). O app mostra o progresso.

**Como implementar:**
- Tabela `metas`: `(id, titulo, valor_alvo, valor_atual, data_limite, descricao)`
- API: `GET/POST/PUT /api/metas`
- UI: Card com barra de progresso, percentual atingido e "faltam R$ X"
- Ação: Usuário pode registrar aportes manuais à meta

---

#### 8. Lançamentos Recorrentes
**Inspirado em:** Mobills e Organizze  
**O que é:** Gastos ou receitas que se repetem todo mês (assinaturas, salário, aluguel) são registrados uma vez e replicados automaticamente.

**Como implementar:**
- Campo `recorrente` e `frequencia` (`mensal`, `anual`, `semanal`) na tabela de lançamentos
- Job agendado (cron no backend): no início de cada mês, criar automaticamente os lançamentos recorrentes
- UI: Indicador de "lançamento automático" com opção de editar/cancelar

---

### 🟢 Prioridade Baixa — Diferencial e Inovação

#### 9. Relatórios Visuais Avançados
**Inspirado em:** Mobills  
**O que é:** Gráficos de pizza (gastos por categoria), barras (evolução mensal), e linha (saldo ao longo do tempo).

**Como implementar:**
- Biblioteca: `Chart.js` ou `Recharts` (leve, boa integração com React/Next.js)
- Endpoints de analytics: `GET /api/relatorios/por-categoria`, `GET /api/relatorios/evolucao-mensal`
- Filtros: por período (mês, trimestre, ano)

---

#### 10. Projeção de Saldo Futuro
**Inspirado em:** Organizze  
**O que é:** Com base nos lançamentos recorrentes e no histórico, o app projeta qual será o saldo no fim do mês ou em meses futuros.

**Como implementar:**
- Cálculo: `saldo_atual + receitas_previstas - despesas_previstas (recorrentes + médias históricas)`
- UI: Linha do tempo visual do saldo esperado

---

#### 13. Exportação de Dados (CSV / PDF)
**Inspirado em:** Mobills e Organizze  
**O que é:** Exportar relatórios de gastos para planilha ou PDF para compartilhar, analisar externamente ou fazer backup.

**Como implementar:**
- Backend: biblioteca `csv-writer` para CSV; `pdfkit` ou `puppeteer` para PDF
- Rota: `GET /api/exportar?formato=csv&mes=&ano=`
- UI: Botão "Exportar" nas páginas de relatório



## 📋 Roadmap Sugerido

| Fase | Funcionalidade | Complexidade | Impacto |
|------|---------------|--------------|---------|
| **Fase 1** | Orçamentos mensais por categoria | Média | ⭐⭐⭐⭐⭐ |
| **Fase 1** | Alertas de gastos | Baixa | ⭐⭐⭐⭐⭐ |
| **Fase 1** | Dashboard com resumo financeiro | Média | ⭐⭐⭐⭐⭐ |
| **Fase 2** | Lançamentos recorrentes | Média | ⭐⭐⭐⭐ |
| **Fase 2** | Gestão de cartão de crédito | Alta | ⭐⭐⭐⭐ |
| **Fase 2** | Metas de economia | Média | ⭐⭐⭐⭐ |
| **Fase 2** | Subcategorias e tags | Baixa | ⭐⭐⭐ |
| **Fase 3** | Relatórios visuais (gráficos) | Média | ⭐⭐⭐⭐ |
| **Fase 3** | Projeção de saldo futuro | Alta | ⭐⭐⭐ |
| **Fase 4** | Exportação CSV/PDF | Média | ⭐⭐⭐ |

---

## 🎯 Principais Diferenciais a Evitar / Observar

| Problema identificado nos concorrentes | Como o app pode se diferenciar |
|----------------------------------------|-------------------------------|
| Alta "fricção" para registrar gastos | Quick-add minimalista (1 clique → lançamento) |
| Abandono por complexidade | Onboarding progressivo — não mostrar tudo de uma vez |
| Falta de privacidade (compartilhamento de login) | Perfis separados com permissões (futuro) |
| Dependência de plano pago para Open Finance | Open Finance via Pluggy já planejado para o app |
| Interface cheia de anúncios (versões gratuitas) | App pessoal sem monetização por anúncio |

---

## 📚 Fontes e Referências

- [Mobills — Site Oficial](https://mobills.com.br)
- [Organizze — Funcionalidades](https://organizze.com.br)
- [Serasa — Comparativo de Apps](https://serasa.com.br)
- [ZapGastos — Análise do Mercado 2026](https://zapgastos.com)
- [Estadão — Melhores Apps Financeiros](https://estadao.com.br)
