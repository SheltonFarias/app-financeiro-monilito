const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const crypto = require('crypto');
require('dotenv').config();

async function migrateData() {
  const sqlite = new Database('data/financeiro.db');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- Starting Data Migration ---');

  // Maps para relacionamentos
  const mapGastosFixos = new Map();
  const mapGastosVar = new Map();
  const mapReceitas = new Map();

  const genId = () => crypto.randomUUID();

  // 1. Cartoes (sem FKs pendentes)
  const cartoesOld = sqlite.prepare('SELECT * FROM cartoes_credito').all();
  console.log(`Migrating ${cartoesOld.length} cartões...`);
  for (const row of cartoesOld) {
    await prisma.cartaoCredito.create({
      data: {
        id: genId(),
        nome: row.nome,
        limite_total: row.limite_total,
        dia_fechamento: row.dia_fechamento,
        dia_vencimento: row.dia_vencimento,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 2. Gastos Fixos
  const fixosOld = sqlite.prepare('SELECT * FROM gastos_fixos').all();
  console.log(`Migrating ${fixosOld.length} gastos fixos...`);
  // Primeiro pass para IDs
  for (const row of fixosOld) {
    mapGastosFixos.set(row.id, genId());
  }
  for (const row of fixosOld) {
    const templateId = row.template_id ? mapGastosFixos.get(row.template_id) : null;
    await prisma.gastoFixo.create({
      data: {
        id: mapGastosFixos.get(row.id),
        categoria: row.categoria,
        descricao: row.descricao,
        valor: row.valor,
        vencimento: row.vencimento,
        cartao: row.cartao || '—',
        situacao: row.situacao,
        mes: row.mes,
        mensal: row.mensal === 1,
        data_inicio: row.data_inicio,
        data_fim: row.data_fim,
        template_id: templateId,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 3. Gastos Variaveis
  const varOld = sqlite.prepare('SELECT * FROM gastos_variaveis').all();
  console.log(`Migrating ${varOld.length} gastos variáveis...`);
  for (const row of varOld) {
    mapGastosVar.set(row.id, genId());
  }
  for (const row of varOld) {
    await prisma.gastoVariavel.create({
      data: {
        id: mapGastosVar.get(row.id),
        categoria: row.categoria,
        descricao: row.descricao,
        valor: row.valor,
        parcela: row.parcela,
        pagamento: row.pagamento || '—',
        situacao: row.situacao,
        mes: row.mes,
        data_compra: row.data_compra,
        subcategoria: row.subcategoria,
        recorrente: row.recorrente === 1,
        frequencia: row.frequencia,
        tags: row.tags,
        grupo_id: row.grupo_id, // Already a string in SQLite if generated via JS, else keep as is or stringify
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 4. Receitas
  const recOld = sqlite.prepare('SELECT * FROM receitas').all();
  console.log(`Migrating ${recOld.length} receitas...`);
  for (const row of recOld) {
    mapReceitas.set(row.id, genId());
  }
  for (const row of recOld) {
    const templateId = row.template_id ? mapReceitas.get(row.template_id) : null;
    await prisma.receita.create({
      data: {
        id: mapReceitas.get(row.id),
        categoria: row.categoria,
        descricao: row.descricao,
        valor: row.valor,
        situacao: row.situacao,
        cartao: row.cartao || '—',
        mes: row.mes,
        mensal: row.mensal === 1,
        data_inicio: row.data_inicio,
        data_fim: row.data_fim,
        template_id: templateId,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 5. Metas
  const metasOld = sqlite.prepare('SELECT * FROM metas').all();
  console.log(`Migrating ${metasOld.length} metas...`);
  for (const row of metasOld) {
    const gvId = row.gasto_variavel_id ? mapGastosVar.get(row.gasto_variavel_id) : null;
    await prisma.meta.create({
      data: {
        id: genId(),
        titulo: row.titulo,
        descricao: row.descricao,
        valor_alvo: row.valor_alvo,
        valor_atual: row.valor_atual,
        data_limite: row.data_limite,
        gasto_variavel_id: gvId,
        contribuicao_ativa: row.contribuicao_ativa === 1,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 6. Investimentos
  const invOld = sqlite.prepare('SELECT * FROM investimentos').all();
  console.log(`Migrating ${invOld.length} investimentos...`);
  for (const row of invOld) {
    await prisma.investimento.create({
      data: {
        id: genId(),
        ticker: row.ticker,
        tipo: row.tipo,
        quantidade: row.quantidade,
        preco_medio: row.preco_medio,
        setor: row.setor,
        data_compra: row.data_compra,
        rentabilidade_cdi: row.rentabilidade_cdi,
        dividendo_anual: row.dividendo_anual,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 7. Orcamentos
  const orcOld = sqlite.prepare('SELECT * FROM orcamentos').all();
  console.log(`Migrating ${orcOld.length} orcamentos...`);
  for (const row of orcOld) {
    await prisma.orcamento.create({
      data: {
        id: genId(),
        categoria: row.categoria,
        valor_limite: row.valor_limite,
        mes: row.mes,
        created_at: row.created_at ? new Date(row.created_at) : new Date(),
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  // 8. Configuracoes
  const confOld = sqlite.prepare('SELECT * FROM configuracoes').all();
  console.log(`Migrating ${confOld.length} configuracoes...`);
  for (const row of confOld) {
    await prisma.configuracao.create({
      data: {
        chave: row.chave,
        valor: row.valor,
        updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
      }
    });
  }

  console.log('--- Migration Completed ---');
  await prisma.$disconnect();
  await pool.end();
}

migrateData().catch(e => console.error(e));
