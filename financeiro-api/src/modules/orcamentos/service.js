export function createOrcamentosService(prisma) {
  const validar = (dados) => {
    if (!dados?.categoria || !/^[A-Za-zÀ-ú]+\d{4}$/.test(dados.mes ?? '') || !Number.isFinite(dados.valor_limite) || dados.valor_limite < 0) throw Object.assign(new Error('Dados inválidos.'), { statusCode: 400 });
    return { categoria: dados.categoria, mes: dados.mes, valor_limite: dados.valor_limite };
  };
  return {
    listar: (mes) => prisma.orcamento.findMany({ ...(mes ? { where: { mes } } : {}), orderBy: mes ? { created_at: 'asc' } : [{ mes: 'asc' }, { created_at: 'asc' }] }),
    async criar(dados) { const data = validar(dados); const existente = await prisma.orcamento.findUnique({ where: { categoria_mes: { categoria: data.categoria, mes: data.mes } } }); if (existente) throw Object.assign(new Error(`Já existe um orçamento para a categoria ${data.categoria} no mês ${data.mes}. Atualize o existente.`), { statusCode: 400 }); return prisma.orcamento.create({ data }); },
    async atualizar(id, dados) { const data = validar(dados); const atual = await prisma.orcamento.findUnique({ where: { id } }); if (!atual) throw Object.assign(new Error('Orçamento não encontrado'), { statusCode: 404 }); const existente = await prisma.orcamento.findUnique({ where: { categoria_mes: { categoria: data.categoria, mes: data.mes } } }); if (existente && existente.id !== id) throw Object.assign(new Error(`Já existe um orçamento para a categoria ${data.categoria} no mês ${data.mes}.`), { statusCode: 400 }); return prisma.orcamento.update({ where: { id }, data }); },
    async deletar(id) { if (!await prisma.orcamento.findUnique({ where: { id } })) throw Object.assign(new Error('Orçamento não encontrado'), { statusCode: 404 }); await prisma.orcamento.delete({ where: { id } }); return { id }; },
  };
}
