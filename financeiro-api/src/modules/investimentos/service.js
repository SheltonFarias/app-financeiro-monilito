function erro(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
function normalizar(dados) {
  if (!dados?.ticker || !dados?.tipo || !Number.isInteger(dados.quantidade) || dados.quantidade < 0 || !Number.isFinite(dados.precoMedio) || dados.precoMedio < 0) throw erro('Dados inválidos.');
  if (!['FII', 'Ação', 'ETF', 'Renda Fixa'].includes(dados.tipo)) throw erro('Tipo de investimento inválido.');
  if (dados.tipo === 'Renda Fixa' && !Number.isFinite(dados.rentabilidadeCdi)) throw erro('Rentabilidade (% do CDI) é obrigatória para Renda Fixa.');
  return { ticker: String(dados.ticker).toUpperCase(), tipo: dados.tipo, quantidade: dados.quantidade, preco_medio: dados.precoMedio, setor: dados.setor ?? null, data_compra: dados.dataCompra ?? null, rentabilidade_cdi: dados.tipo === 'Renda Fixa' ? dados.rentabilidadeCdi : null, dividendo_anual: dados.dividendoAnual ?? null };
}
export function createInvestimentosService(prisma) {
  return {
    listar: () => prisma.investimento.findMany({ orderBy: { created_at: 'asc' } }),
    async criar(dados) { const data = normalizar(dados); if (await prisma.investimento.findUnique({ where: { ticker: data.ticker } })) throw erro(`Investimento com ticker "${data.ticker}" já existe. Use PUT para editar.`, 409); return prisma.investimento.create({ data }); },
    async atualizar(id, dados) { const data = normalizar(dados); const atual = await prisma.investimento.findUnique({ where: { id } }); if (!atual) throw erro('Investimento não encontrado.', 404); if (data.ticker !== atual.ticker) { const outro = await prisma.investimento.findUnique({ where: { ticker: data.ticker } }); if (outro) throw erro(`Ticker "${data.ticker}" já está em uso por outro investimento.`, 409); } return prisma.investimento.update({ where: { id }, data }); },
    async remover(id) { if (!await prisma.investimento.findUnique({ where: { id } })) throw erro('Investimento não encontrado.', 404); await prisma.investimento.delete({ where: { id } }); },
  };
}
