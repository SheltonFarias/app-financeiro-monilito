function erro(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
function validar(dados) {
  if (!dados?.titulo || dados.titulo.length > 100 || !Number.isFinite(dados.valor_alvo) || dados.valor_alvo < 0 || !Number.isFinite(dados.valor_atual ?? 0) || (dados.data_limite && !/^\d{4}-\d{2}-\d{2}$/.test(dados.data_limite))) throw erro('Dados inválidos');
  return { titulo: dados.titulo, descricao: dados.descricao ?? null, valor_alvo: dados.valor_alvo, valor_atual: dados.valor_atual ?? 0, data_limite: dados.data_limite ?? null };
}
function mesesRestantes(data) { if (!data) return null; const limite = new Date(data); const hoje = new Date(); const total = (limite.getFullYear() - hoje.getFullYear()) * 12 + limite.getMonth() - hoje.getMonth(); return total > 0 ? total : null; }
function mesAtual() { return ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][new Date().getMonth()] + new Date().getFullYear(); }
export function createMetasService(prisma) {
  return {
    listar: () => prisma.meta.findMany({ orderBy: { created_at: 'asc' } }),
    criar: (dados) => prisma.meta.create({ data: validar(dados) }),
    async atualizar(id, dados) { if (!await prisma.meta.findUnique({ where: { id } })) throw erro('Meta não encontrada', 404); return prisma.meta.update({ where: { id }, data: validar(dados) }); },
    async deletar(id) { if (!await prisma.meta.findUnique({ where: { id } })) throw erro('Meta não encontrada', 404); await prisma.meta.delete({ where: { id } }); return { id }; },
    async ativarContribuicao(id, mes = mesAtual()) {
      const meta = await prisma.meta.findUnique({ where: { id } }); if (!meta) throw erro('Meta não encontrada', 404); if (meta.contribuicao_ativa) throw erro('Contribuição já está ativa para esta meta.');
      const meses = mesesRestantes(meta.data_limite); if (!meses) throw erro('Não é possível ativar a contribuição: data limite não definida ou já passou.');
      const falta = meta.valor_alvo - meta.valor_atual; if (falta <= 0) throw erro('Meta já atingida — valor atual é igual ou superior ao alvo.');
      const valor = Math.ceil((falta / meses) * 100) / 100;
      return prisma.$transaction(async (tx) => { const gasto = await tx.gastoVariavel.create({ data: { categoria: 'Outros', descricao: `Meta: ${meta.titulo}`, valor, pagamento: 'Pix', situacao: 'Pendente', mes, recorrente: true } }); const atualizada = await tx.meta.update({ where: { id }, data: { contribuicao_ativa: true, gasto_variavel_id: gasto.id } }); return { ...atualizada, contribuicao_mensal: valor, meses_restantes: meses }; });
    },
    async desativarContribuicao(id) { const meta = await prisma.meta.findUnique({ where: { id } }); if (!meta) throw erro('Meta não encontrada', 404); return prisma.$transaction(async (tx) => { if (meta.gasto_variavel_id) await tx.gastoVariavel.delete({ where: { id: meta.gasto_variavel_id } }).catch(() => undefined); return tx.meta.update({ where: { id }, data: { contribuicao_ativa: false, gasto_variavel_id: null } }); }); },
  };
}
