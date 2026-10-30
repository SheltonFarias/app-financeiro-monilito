function erro(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function normalizar(dados) {
  if (!dados?.ticker || !dados?.tipo || !Number.isInteger(dados.quantidade) || dados.quantidade < 0 || !Number.isFinite(dados.precoMedio) || dados.precoMedio < 0) {
    throw erro('Dados inválidos.');
  }
  if (!['FII', 'Ação', 'ETF', 'Renda Fixa'].includes(dados.tipo)) {
    throw erro('Tipo de investimento inválido.');
  }
  const indexador = dados.tipo === 'Renda Fixa' ? (dados.indexador || 'CDI') : null;
  if (dados.tipo === 'Renda Fixa' && !['CDI', 'Prefixado', 'IPCA+'].includes(indexador)) {
    throw erro('Indexador de renda fixa inválido.');
  }
  if (dados.tipo === 'Renda Fixa' && indexador === 'CDI' && !Number.isFinite(dados.rentabilidadeCdi)) {
    throw erro('Rentabilidade (% do CDI) é obrigatória para títulos pós-fixados.');
  }
  if (dados.tipo === 'Renda Fixa' && indexador !== 'CDI' && !Number.isFinite(dados.taxaAnual)) {
    throw erro('Taxa anual é obrigatória para títulos prefixados e IPCA+.');
  }

  return {
    ticker: String(dados.ticker).trim().toUpperCase(),
    tipo: dados.tipo,
    quantidade: dados.quantidade,
    preco_medio: dados.precoMedio,
    setor: dados.setor ?? null,
    data_compra: dados.dataCompra ?? null,
    rentabilidade_cdi: dados.tipo === 'Renda Fixa' ? dados.rentabilidadeCdi : null,
    indexador,
    taxa_anual: dados.tipo === 'Renda Fixa' ? (dados.taxaAnual ?? null) : null,
    emissor: dados.tipo === 'Renda Fixa' ? (dados.emissor ?? null) : null,
    liquidez: dados.tipo === 'Renda Fixa' ? (dados.liquidez ?? null) : null,
    data_vencimento: dados.tipo === 'Renda Fixa' ? (dados.dataVencimento ?? null) : null,
    dividendo_anual: dados.dividendoAnual ?? null,
    usar_cofre: dados.usarCofre === true,
  };
}

export function createInvestimentosService(prisma) {
  return {
    listar: () => prisma.investimento.findMany({ orderBy: { created_at: 'asc' } }),

    async criar(dados) {
      const aporte = normalizar(dados);
      const atual = await prisma.investimento.findUnique({ where: { ticker: aporte.ticker } });

      if (!atual) return prisma.investimento.create({ data: aporte });

      if (atual.tipo !== aporte.tipo) {
        throw erro(`O ticker "${aporte.ticker}" já existe com o tipo ${atual.tipo}. Edite o ativo existente para alterar sua classificação.`, 409);
      }

      const quantidadeTotal = atual.quantidade + aporte.quantidade;
      const precoMedio = quantidadeTotal === 0
        ? 0
        : ((atual.quantidade * atual.preco_medio) + (aporte.quantidade * aporte.preco_medio)) / quantidadeTotal;

      return prisma.investimento.update({
        where: { id: atual.id },
        data: {
          quantidade: quantidadeTotal,
          preco_medio: precoMedio,
          setor: aporte.setor ?? atual.setor,
          data_compra: aporte.data_compra ?? atual.data_compra,
          rentabilidade_cdi: aporte.rentabilidade_cdi ?? atual.rentabilidade_cdi,
          indexador: aporte.indexador ?? atual.indexador,
          taxa_anual: aporte.taxa_anual ?? atual.taxa_anual,
          emissor: aporte.emissor ?? atual.emissor,
          liquidez: aporte.liquidez ?? atual.liquidez,
          data_vencimento: aporte.data_vencimento ?? atual.data_vencimento,
          dividendo_anual: aporte.dividendo_anual ?? atual.dividendo_anual,
          usar_cofre: atual.usar_cofre || aporte.usar_cofre,
        },
      });
    },

    async atualizar(id, dados) {
      const data = normalizar(dados);
      const atual = await prisma.investimento.findUnique({ where: { id } });
      if (!atual) throw erro('Investimento não encontrado.', 404);
      if (data.ticker !== atual.ticker) {
        const outro = await prisma.investimento.findUnique({ where: { ticker: data.ticker } });
        if (outro) throw erro(`Ticker "${data.ticker}" já está em uso por outro investimento.`, 409);
      }
      return prisma.investimento.update({ where: { id }, data });
    },

    async remover(id) {
      if (!await prisma.investimento.findUnique({ where: { id } })) throw erro('Investimento não encontrado.', 404);
      await prisma.investimento.delete({ where: { id } });
    },
  };
}
