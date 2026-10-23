import { createApiDashboardService } from './service.js';

const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function intervaloMes(mes) {
  const found = MESES.find((nome) => mes.startsWith(nome));
  if (!found) throw Object.assign(new Error(`Mês inválido: "${mes}". Use o formato "Julho2026".`), { statusCode: 400 });
  const ano = Number(mes.slice(found.length));
  if (!Number.isInteger(ano)) throw Object.assign(new Error(`Mês inválido: "${mes}". Use o formato "Julho2026".`), { statusCode: 400 });
  const indice = MESES.indexOf(found);
  const inicio = `${ano}-${String(indice + 1).padStart(2, '0')}-01`;
  const ultimoDia = new Date(ano, indice + 1, 0).getDate();
  return { inicio, fim: `${ano}-${String(indice + 1).padStart(2, '0')}-${ultimoDia}` };
}

function createGastosFixosService(prisma) {
  return {
    async listarPorMes(mes) {
      const { inicio, fim } = intervaloMes(mes);
      const copias = await prisma.gastoFixo.findMany({ where: { template_id: { not: null }, mes }, select: { template_id: true } });
      const templates = await prisma.gastoFixo.findMany({
        where: {
          template_id: null, mes: { not: mes },
          OR: [{ mensal: true }, { data_fim: { not: null, gte: inicio } }],
          AND: [{ OR: [{ data_inicio: null }, { data_inicio: { lte: fim } }] }],
          ...(copias.length ? { id: { notIn: copias.map((item) => item.template_id).filter(Boolean) } } : {}),
        },
        orderBy: { created_at: 'asc' },
      });
      for (const item of templates) {
        await prisma.gastoFixo.create({ data: {
          categoria: item.categoria, descricao: item.descricao, valor: item.valor, vencimento: item.vencimento,
          cartao: item.cartao, situacao: 'Pendente', mes, mensal: item.mensal, data_inicio: item.data_inicio,
          data_fim: item.data_fim, template_id: item.id,
        } });
      }
      return prisma.gastoFixo.findMany({ where: { mes }, orderBy: { created_at: 'asc' } });
    },
  };
}

function createReceitasService(prisma) {
  return {
    async listarPorMes(mes) {
      const { inicio, fim } = intervaloMes(mes);
      const copias = await prisma.receita.findMany({ where: { template_id: { not: null }, mes }, select: { template_id: true } });
      const templates = await prisma.receita.findMany({
        where: {
          template_id: null, mes: { not: mes },
          OR: [{ mensal: true }, { data_fim: { not: null, gte: inicio } }],
          AND: [{ OR: [{ data_inicio: null }, { data_inicio: { lte: fim } }] }],
          ...(copias.length ? { id: { notIn: copias.map((item) => item.template_id).filter(Boolean) } } : {}),
        }, orderBy: { created_at: 'asc' },
      });
      for (const item of templates) {
        await prisma.receita.create({ data: {
          categoria: item.categoria, descricao: item.descricao, valor: item.valor, situacao: 'Pendente',
          cartao: item.cartao || '—', mes, recorrente: item.mensal, mensal: item.mensal,
          data_inicio: item.data_inicio, data_fim: item.data_fim, template_id: item.id,
        } });
      }
      return prisma.receita.findMany({ where: { mes }, orderBy: { created_at: 'asc' } });
    },
  };
}

export function createPrismaDashboardService(prisma) {
  const gastosVariaveisRepository = {
    findByMes: (mes) => prisma.gastoVariavel.findMany({ where: { mes }, orderBy: { created_at: 'asc' } }),
    findAll: () => prisma.gastoVariavel.findMany({ orderBy: [{ mes: 'asc' }, { created_at: 'asc' }] }),
    create: (dados) => prisma.gastoVariavel.create({ data: {
      categoria: dados.categoria, descricao: dados.descricao, valor: dados.valor, data_compra: dados.data_compra ?? null,
      pagamento: dados.pagamento, situacao: dados.situacao ?? 'Pendente', mes: dados.mes, recorrente: Boolean(dados.recorrente), grupo_id: dados.grupo_id ?? null,
    } }),
  };

  return createApiDashboardService({
    gastosFixosService: createGastosFixosService(prisma),
    gastosVariaveisRepository,
    receitasService: createReceitasService(prisma),
    receitasRepository: { findAll: () => prisma.receita.findMany({ orderBy: [{ mes: 'asc' }, { created_at: 'asc' }] }) },
    gastosFixosRepository: { findAll: () => prisma.gastoFixo.findMany({ orderBy: [{ mes: 'asc' }, { created_at: 'asc' }] }) },
    investimentosRepository: { findAll: () => prisma.investimento.findMany({ orderBy: { ticker: 'asc' } }) },
    orcamentosRepository: { findByMes: (mes) => prisma.orcamento.findMany({ where: { mes }, orderBy: { created_at: 'asc' } }) },
    metasRepository: { findAll: () => prisma.meta.findMany({ orderBy: { created_at: 'asc' } }) },
    cartoesRepository: { findAll: () => prisma.cartaoCredito.findMany({ orderBy: { created_at: 'asc' } }) },
  });
}
