const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function erro(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
function bool(value) { return value === true || value === 1 || value === '1'; }
function parseMes(mes) {
  const match = /^(Janeiro|Fevereiro|Marco|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)(\d{4})$/.exec(mes ?? '');
  if (!match) throw erro('Mês inválido. Use o formato "Junho2026".');
  return { index: MESES.indexOf(match[1]), ano: Number(match[2]) };
}
function intervalo(mes) {
  const { index, ano } = parseMes(mes);
  const fim = new Date(ano, index + 1, 0).getDate();
  return { inicio: `${ano}-${String(index + 1).padStart(2, '0')}-01`, fim: `${ano}-${String(index + 1).padStart(2, '0')}-${fim}` };
}
function proximosMeses(mes, quantidade) {
  const { index, ano } = parseMes(mes);
  return Array.from({ length: quantidade }, (_, offset) => MESES[(index + offset) % 12] + (ano + Math.floor((index + offset) / 12)));
}
function validarBase(dados, tipo) {
  if (!dados || typeof dados !== 'object') throw erro('Dados inválidos.');
  if (!dados.categoria || !dados.descricao || !Number.isFinite(dados.valor) || dados.valor < 0 || !dados.mes) throw erro('Dados obrigatórios inválidos.');
  parseMes(dados.mes);
  if (tipo === 'variavel' && !dados.pagamento) throw erro('Pagamento é obrigatório.');
  if (tipo === 'variavel' && !['Pendente', 'Pago'].includes(dados.situacao ?? 'Pendente')) throw erro('Situação inválida.');
  if (tipo === 'fixo' && !['Pendente', 'Pago'].includes(dados.situacao ?? 'Pendente')) throw erro('Situação inválida.');
  if (tipo === 'receita' && !['Pendente', 'Recebido'].includes(dados.situacao ?? 'Pendente')) throw erro('Situação inválida.');
}

export function createLancamentosService(prisma, tipo) {
  const modelKey = tipo === 'fixo' ? 'gastoFixo' : tipo === 'variavel' ? 'gastoVariavel' : 'receita';
  const model = prisma[modelKey];
  const recorrente = tipo !== 'variavel';
  const nome = tipo === 'fixo' ? 'Gasto fixo' : tipo === 'variavel' ? 'Gasto variável' : 'Receita';
  const normalizar = (dados, extras = {}) => {
    validarBase(dados, tipo);
    const common = { categoria: dados.categoria, descricao: dados.descricao, valor: dados.valor, situacao: dados.situacao ?? 'Pendente', mes: dados.mes, ...extras };
    if (tipo === 'fixo') return { ...common, vencimento: dados.vencimento ?? null, cartao: dados.cartao ?? null, mensal: bool(dados.mensal), data_inicio: dados.data_inicio ?? null, data_fim: dados.data_fim ?? null };
    if (tipo === 'receita') return { ...common, cartao: dados.cartao ?? null, recorrente: bool(dados.recorrente), mensal: bool(dados.mensal), data_inicio: dados.data_inicio ?? null, data_fim: dados.data_fim ?? null };
    return { ...common, data_compra: dados.dataCompra ?? dados.data_compra ?? null, pagamento: dados.pagamento, recorrente: bool(dados.recorrente), subcategoria: dados.subcategoria ?? null, tags: dados.tags ?? null };
  };
  async function propagar(mes) {
    if (!recorrente) return;
    const { inicio, fim } = intervalo(mes);
    const copias = await model.findMany({ where: { template_id: { not: null }, mes }, select: { template_id: true } });
    const where = { template_id: null, mes: { not: mes }, OR: [{ mensal: true }, { data_fim: { not: null, gte: inicio } }], AND: [{ OR: [{ data_inicio: null }, { data_inicio: { lte: fim } }] }], ...(copias.length ? { id: { notIn: copias.map(({ template_id }) => template_id) } } : {}) };
    const templates = await model.findMany({ where, orderBy: { created_at: 'asc' } });
    for (const template of templates) {
      const { id, created_at, updated_at, template: _template, copias: _copias, ...data } = template;
      await model.create({ data: { ...data, mes, situacao: 'Pendente', template_id: id } });
    }
  }
  return {
    async listarPorMes(mes) { parseMes(mes); await propagar(mes); return model.findMany({ where: { mes }, orderBy: { created_at: 'asc' } }); },
    async criar(dados) {
      if (tipo !== 'variavel') return model.create({ data: normalizar(dados) });
      const quantidade = Number(dados.qtd_parcelas ?? 1);
      if (!Number.isInteger(quantidade) || quantidade < 1) throw erro('Quantidade de parcelas inválida.');
      const meses = proximosMeses(dados.mes, quantidade);
      const grupo_id = quantidade > 1 ? `gv_${crypto.randomUUID()}` : null;
      let primeiro;
      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < quantidade; i += 1) {
          const item = await tx.gastoVariavel.create({ data: normalizar({ ...dados, descricao: quantidade > 1 ? `${dados.descricao} (${i + 1}/${quantidade})` : dados.descricao, valor: quantidade > 1 ? Number((dados.valor / quantidade).toFixed(2)) : dados.valor, mes: meses[i], situacao: i === 0 ? (dados.situacao ?? 'Pendente') : 'Pendente' }, { grupo_id }) });
          if (!primeiro) primeiro = item;
        }
      });
      return primeiro;
    },
    async atualizar(id, dados) { const atual = await model.findUnique({ where: { id } }); if (!atual) throw erro(`${nome} não encontrado.`, 404); return model.update({ where: { id }, data: normalizar(dados) }); },
    async atualizarStatus(id, situacao) {
      const atual = await model.findUnique({ where: { id } }); if (!atual) throw erro(`${nome} não encontrado.`, 404);
      const permitidos = tipo === 'receita' ? ['Pendente', 'Recebido'] : ['Pendente', 'Pago'];
      if (!permitidos.includes(situacao)) throw erro('Situação inválida.');
      return prisma.$transaction(async (tx) => {
        const item = await tx[modelKey].update({ where: { id }, data: { situacao } });
        if (tipo === 'variavel' && atual.situacao !== situacao) {
          const meta = await tx.meta.findFirst({ where: { gasto_variavel_id: id } });
          if (meta) { const delta = situacao === 'Pago' ? atual.valor : -atual.valor; await tx.meta.update({ where: { id: meta.id }, data: { valor_atual: Math.max(0, meta.valor_atual + delta) } }); }
        }
        return item;
      });
    },
    async remover(id) { const atual = await model.findUnique({ where: { id } }); if (!atual) throw erro(`${nome} não encontrado.`, 404); await prisma.$transaction([model.delete({ where: { id } }), ...(tipo === 'variavel' ? [prisma.meta.updateMany({ where: { gasto_variavel_id: id }, data: { gasto_variavel_id: null, contribuicao_ativa: false } })] : [])]); },
    async removerSerie(id) { const atual = await model.findUnique({ where: { id } }); if (!atual) throw erro(`${nome} não encontrado.`, 404); if (tipo === 'variavel') { const result = await model.deleteMany({ where: atual.grupo_id ? { grupo_id: atual.grupo_id } : { id } }); return { removidos: result.count }; } const templateId = atual.template_id ?? id; await prisma.$transaction([model.deleteMany({ where: { template_id: templateId } }), model.delete({ where: { id: templateId } })]); return { removidos: 1 }; },
  };
}
