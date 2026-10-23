import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../src/config.js';
import { createPrismaClient } from '../../src/database/client.js';
import { createPrismaDashboardService } from '../../src/modules/dashboard/prisma-adapter.js';
import { createConfiguracoesService } from '../../src/modules/configuracoes/service.js';
import { createRelatoriosService } from '../../src/modules/relatorios/service.js';
import { createCartoesService } from '../../src/modules/cartoes/service.js';
import { createOrcamentosService } from '../../src/modules/orcamentos/service.js';
import { createMetasService } from '../../src/modules/metas/service.js';

const shouldRun = process.env.RUN_DATABASE_TESTS === 'true';

test('dashboard nativo lê o PostgreSQL e reverte qualquer recorrência de teste', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig();
  assert.ok(config.databaseUrl, 'DATABASE_URL deve estar configurada.');
  const prisma = createPrismaClient(config.databaseUrl);
  const rollback = new Error('ROLLBACK_DASHBOARD_TEST');
  let data;

  try {
    await prisma.$transaction(async (transaction) => {
      data = await createPrismaDashboardService(transaction).carregarDados('Junho2026');
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }

  assert.deepEqual(Object.keys(data).sort(), [
    'cartoes', 'gastosFixos', 'gastosVariaveis', 'investimentos', 'metas', 'orcamentos', 'receitas',
  ]);
  for (const value of Object.values(data)) assert.ok(Array.isArray(value));
});

test('histórico nativo lê o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    const data = await createPrismaDashboardService(prisma).carregarHistorico();
    assert.deepEqual(Object.keys(data).sort(), ['gastosFixos', 'gastosVariaveis', 'receitas']);
    for (const value of Object.values(data)) assert.ok(Array.isArray(value));
  } finally {
    await prisma.$disconnect();
  }
});

test('configurações nativas leem e convertem o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    const data = await createConfiguracoesService(prisma).getAllParsed();
    assert.equal(Object.getPrototypeOf(data), Object.prototype);
  } finally {
    await prisma.$disconnect();
  }
});

test('configurações nativas fazem upsert e revertem a alteração de teste', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  const rollback = new Error('ROLLBACK_CONFIG_TEST');
  try {
    await prisma.$transaction(async (transaction) => {
      const service = createConfiguracoesService(transaction);
      const data = await service.updateConfig('__migration_test_config__', ['teste']);
      assert.deepEqual(data, { chave: '__migration_test_config__', valor: ['teste'] });
      const saved = await transaction.configuracao.findUnique({ where: { chave: '__migration_test_config__' } });
      assert.equal(saved.valor, '["teste"]');
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }
});

test('relatórios nativos consultam o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    const service = createRelatoriosService(prisma);
    const historico = await service.historicoConsolidado();
    const projecao = await service.gerarProjecao('Junho2026', 1);
    assert.ok(Array.isArray(historico));
    assert.equal(projecao.length, 2);
  } finally {
    await prisma.$disconnect();
  }
});

test('cartões nativos consultam o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig(); const prisma = createPrismaClient(config.databaseUrl);
  try { assert.ok(Array.isArray(await createCartoesService(prisma).listar())); }
  finally { await prisma.$disconnect(); }
});

test('cartões nativos fazem CRUD e revertem alterações de teste', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig(); const prisma = createPrismaClient(config.databaseUrl); const rollback = new Error('ROLLBACK_CARTOES_TEST');
  try {
    await prisma.$transaction(async (transaction) => {
      const service = createCartoesService(transaction);
      const criado = await service.criar({ nome: '__migration_test_card__', limite_total: 1000, dia_fechamento: 10, dia_vencimento: 20 });
      const atualizado = await service.atualizar(criado.id, { nome: '__migration_test_card__', limite_total: 1200, dia_fechamento: 11, dia_vencimento: 21 });
      assert.equal(atualizado.limite_total, 1200);
      assert.deepEqual(await service.deletar(criado.id), { id: criado.id });
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  finally { await prisma.$disconnect(); }
});

test('orçamentos nativos consultam o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig(); const prisma = createPrismaClient(config.databaseUrl);
  try { assert.ok(Array.isArray(await createOrcamentosService(prisma).listar('Junho2026'))); }
  finally { await prisma.$disconnect(); }
});

test('metas nativas consultam o PostgreSQL sem escrita', {
  skip: !shouldRun && 'Defina RUN_DATABASE_TESTS=true em uma base de homologação.',
}, async () => {
  const config = loadConfig(); const prisma = createPrismaClient(config.databaseUrl);
  try { assert.ok(Array.isArray(await createMetasService(prisma).listar())); }
  finally { await prisma.$disconnect(); }
});
