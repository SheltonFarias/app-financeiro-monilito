/**
 * Dados mockados baseados na planilha real (panilha-padrao.xlsx).
 * Serão substituídos pela integração com Google Sheets na Fase 4.
 */

export const mockData = {
  mesAtual: "Junho2026",

  resumo: {
    receitaRecebida: 0,
    dividasPagas: 0,
    dividasPendentes: 2351.51,
    saldoFinal: 478.49,
    investimento: 0,
    renda: 2830,
    gastoFixo: 1767.08,
    gastoVariavel: 584.43,
  },

  gastosFixos: [
    { categoria: "Educação", descricao: "Pos-graduação", valor: 0, vencimento: "-x-", cartao: "—", situacao: "Pago", mes: "Junho2026" },
    { categoria: "Veiculo", descricao: "Seguro", valor: 60, vencimento: "-x-", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Casa", descricao: "Internet", valor: 70, vencimento: "-x-", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Outros", descricao: "Spotify", valor: 7, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Outros", descricao: "Tim", valor: 130, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Apartamento", descricao: "Financiamento", valor: 715, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Apartamento", descricao: "Condominio", valor: 320, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Apartamento", descricao: "IPTU", valor: 88.01, vencimento: "2026-09-06", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Casa", descricao: "Parcelamento Enel", valor: 227.07, vencimento: "2026-07-05", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Lazer", descricao: "Boxe", valor: 70, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Outros", descricao: "Kimono", valor: 80, vencimento: "2026-10-06", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Casa", descricao: "Aluguel", valor: 650, vencimento: "Mensal", cartao: "—", situacao: "Pendente", mes: "Junho2026" },
  ],

  gastosVariaveis: [
    { categoria: "Alimentação", descricao: "Supermercado", valor: 620, parcela: "", dataCompra: "2026-06-05", pagamento: "Nubank", situacao: "Pago", mes: "Junho2026" },
    { categoria: "Transporte",  descricao: "Combustível",  valor: 280, parcela: "", dataCompra: "2026-06-03", pagamento: "Inter",  situacao: "Pago", mes: "Junho2026" },
    { categoria: "Lazer",       descricao: "Restaurante",  valor: 340, parcela: "2026-06-07", dataCompra: "2026-05-07", pagamento: "Nubank", situacao: "Pendente", mes: "Junho2026" },
    { categoria: "Saúde",       descricao: "Farmácia",     valor: 95,  parcela: "2026-06-15", dataCompra: "2026-06-02", pagamento: "Débito", situacao: "Pendente", mes: "Junho2026" },
  ],

  receitas: [
    { categoria: "Trabalho", descricao: "Salário", valor: 8000, situacao: "Recebido", cartao: "—", mes: "Junho2026" },
    { categoria: "Apartamento", descricao: "Aluguel", valor: 2500, situacao: "Pendente", cartao: "—", mes: "Junho2026" },
  ],

  investimentos: [
    // Vazio por enquanto — será preenchido pelo usuário
  ],

  evolucaoMensal: [
    { mes: "Jun", gastos: 2351.51, receitas: 2830 },
    { mes: "Jul", gastos: 3648.28, receitas: 2830 },
  ],
};
