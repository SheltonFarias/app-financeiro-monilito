export function createConfiguracoesService(prisma) {
  return {
    async getAllParsed() {
      const rows = await prisma.configuracao.findMany();
      return rows.reduce((configuracoes, row) => {
        try {
          configuracoes[row.chave] = JSON.parse(row.valor);
        } catch {
          configuracoes[row.chave] = row.valor;
        }
        return configuracoes;
      }, {});
    },

    async updateConfig(chave, valor) {
      if (!chave) throw Object.assign(new Error('A chave é obrigatória.'), { statusCode: 400 });
      const stringValue = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
      await prisma.configuracao.upsert({
        where: { chave },
        create: { chave, valor: stringValue },
        update: { valor: stringValue },
      });
      return { chave, valor };
    },
  };
}
