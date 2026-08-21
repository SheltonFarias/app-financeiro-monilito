# Plano de Migração: SQLite para Supabase + Prisma

Este documento detalha o passo a passo para refatorar o Monólito Financeiro, saindo do banco de dados local SQLite (`better-sqlite3`) para um banco de dados em nuvem PostgreSQL hospedado no **Supabase**, utilizando o ORM **Prisma** para comunicação com o banco. 

Essa migração garantirá que a aplicação possa ser hospedada na Vercel e escale perfeitamente.

## ⚠️ User Review Required
Antes de iniciar a execução deste plano, preciso da sua aprovação. Além disso, certifique-se de que você já possui uma conta no [Supabase](https://supabase.com) e criou um projeto lá para pegar a `DATABASE_URL` e `DIRECT_URL`.

## ❓ Open Questions
1. **Dados Atuais:** Você já possui dados importantes lançados no seu sistema local (SQLite) que precisam ser migrados/copiados para o Supabase, ou podemos começar com o banco de dados do Supabase "zerado"?
2. **UUID vs ID Sequencial:** Atualmente o SQLite usa IDs numéricos (1, 2, 3...). O Supabase (Prisma) pode manter numéricos (Auto-increment) ou usar UUIDs (Textos aleatórios). Deseja manter IDs numéricos para simplificar a transição?

---

## Proposed Changes

### 1. Dependências e Configurações Iniciais
- **Remover:** O pacote `better-sqlite3` e a pasta `src/backend/database/` inteira (pois não precisaremos mais do `migrate.js` e `.sql` em raw script).
- **Instalar:** 
  - `npm install prisma --save-dev`
  - `npm install @prisma/client`
- **Inicializar Prisma:** Rodar `npx prisma init`.
- **Configurar `.env`:** Adicionar `DATABASE_URL` (Connection pool do Supabase) e `DIRECT_URL`.

### 2. Criação do Schema Prisma (`prisma/schema.prisma`)
Tradução de todas as tabelas atuais para o formato Prisma. 
Tabelas que serão mapeadas:
- `Usuario` (se existir) / `Configuracoes`
- `Orcamento` e `OrcamentoCategoria`
- `Meta`
- `CartaoCredito`
- `GastoFixo`
- `Receita` e `ReceitaSerie`
- `Investimento`
- `CotacaoAtivo`

*Exemplo de transição:*
```prisma
model Receita {
  id          Int      @id @default(autoincrement())
  descricao   String
  valor       Float
  categoria   String
  mes         String
  situacao    String   @default("Pendente") // "Pendente", "Recebido"
  created_at  DateTime @default(now())
}
```

### 3. Refatoração dos Repositórios (`Repositories`)
Atualmente, as classes de Repositório usam SQL puro de forma síncrona.
- **[MODIFY] Todos os repositórios em `src/backend/modules/**/...repository.js`**
- As chamadas `db.prepare('SELECT ...').all()` serão trocadas para métodos Prisma:
  - *Antes:* `return db.prepare('SELECT * FROM receitas').all();`
  - *Depois:* `return await prisma.receita.findMany();`

### 4. Refatoração dos Serviços (`Services`)
Como o `better-sqlite3` é síncrono, os nossos Services atualmente também são síncronos.
- **[MODIFY] Todos os services em `src/backend/modules/**/...service.js`**
- Adicionar `async / await` em todos os métodos de CRUD (ex: `async listarPorMes(mes)`, `await GastosFixosRepository.findByMes(mes)`).
- Atualizar o `DashboardService` para aguardar todas as *Promises* simultaneamente com `Promise.all()`, ganhando extrema velocidade na resposta.

### 5. Script de Migração de Dados (Opcional)
Se for necessário migrar dados:
- **[NEW] `scripts/migrate_data.js`**: Um script isolado que fará a leitura local do `financeiro.db` via `better-sqlite3` e fará a inserção massiva usando `prisma` no Supabase.

---

## Verification Plan

### Automated Tests / Scripts
- Gerar o banco via `npx prisma db push` e confirmar criação das tabelas no Supabase.
- (Se houver dados locais) Rodar o script de migração e verificar se os totais batem.

### Manual Verification
- Acessar o frontend local (`localhost:3000`), navegar entre todas as abas (Dashboard, Gastos, Receitas, Investimentos, Metas) e garantir que o carregamento funcione sem erros 500.
- Criar e excluir registros via UI ou via **Bot do Telegram** para garantir que a inserção `async` do Prisma está conectada perfeitamente na API.
- Testar o deploy na **Vercel**.


appfinanceiro