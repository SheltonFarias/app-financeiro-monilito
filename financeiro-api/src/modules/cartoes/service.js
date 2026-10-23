export function createCartoesService(prisma) {
  const validar = (dados) => {
    if (!dados?.nome || String(dados.nome).length > 100) throw Object.assign(new Error('Dados inválidos: Nome é obrigatório'), { statusCode: 400 });
    for (const chave of ['limite_total', 'dia_fechamento', 'dia_vencimento']) if (!Number.isFinite(dados[chave])) throw Object.assign(new Error('Dados inválidos: campo numérico inválido'), { statusCode: 400 });
    if (dados.limite_total < 0 || !Number.isInteger(dados.dia_fechamento) || !Number.isInteger(dados.dia_vencimento) || dados.dia_fechamento < 1 || dados.dia_fechamento > 31 || dados.dia_vencimento < 1 || dados.dia_vencimento > 31) throw Object.assign(new Error('Dados inválidos: campo fora do intervalo'), { statusCode: 400 });
    return dados;
  };
  return {
    listar: () => prisma.cartaoCredito.findMany({ orderBy: { created_at: 'asc' } }),
    async criar(dados) { const item = await prisma.cartaoCredito.create({ data: validar(dados) }); return item; },
    async atualizar(id, dados) { validar(dados); const atual = await prisma.cartaoCredito.findUnique({ where: { id } }); if (!atual) throw Object.assign(new Error('Cartão não encontrado'), { statusCode: 404 }); return prisma.cartaoCredito.update({ where: { id }, data: dados }); },
    async deletar(id) { const atual = await prisma.cartaoCredito.findUnique({ where: { id } }); if (!atual) throw Object.assign(new Error('Cartão não encontrado'), { statusCode: 404 }); await prisma.cartaoCredito.delete({ where: { id } }); return { id }; },
  };
}
