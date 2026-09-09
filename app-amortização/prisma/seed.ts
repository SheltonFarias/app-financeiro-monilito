import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PAGAMENTOS = [
  // Fase construção — parcelas reduzidas (só juros sobre saldo liberado)
  { n: 1,  data: '2022-01-10', valor: 317.41 },
  { n: 2,  data: '2022-02-10', valor: 363.39 },
  { n: 3,  data: '2022-03-10', valor: 359.87 },
  { n: 4,  data: '2022-04-10', valor: 479.00 },
  { n: 5,  data: '2022-05-10', valor: 482.60 },
  { n: 6,  data: '2022-06-10', valor: 641.70 },
  { n: 7,  data: '2022-07-10', valor: 642.26 },
  { n: 8,  data: '2022-08-10', valor: 667.82 },
  { n: 9,  data: '2022-09-10', valor: 770.54 },
  { n: 10, data: '2022-10-10', valor: 703.83 },
  { n: 11, data: '2022-11-10', valor: 670.30 },
  { n: 12, data: '2022-12-10', valor: 672.73 },
  // Fase amortização plena
  { n: 13, data: '2023-01-10', valor: 741.26 },
  { n: 14, data: '2023-02-10', valor: 743.39 },
  { n: 15, data: '2023-03-10', valor: 592.65 },
  { n: 16, data: '2023-04-10', valor: 782.51 },
  { n: 17, data: '2023-05-10', valor: 591.56 },
  { n: 18, data: '2023-06-10', valor: 752.73 },
  { n: 19, data: '2023-07-10', valor: 710.43 },
  { n: 20, data: '2023-08-10', valor: 687.40 },
  { n: 21, data: '2023-09-10', valor: 688.91 },
  { n: 22, data: '2023-10-10', valor: 689.63 },
  { n: 23, data: '2023-11-10', valor: 690.37 },
  { n: 24, data: '2023-12-10', valor: 690.89 },
  { n: 25, data: '2024-01-10', valor: 691.32 },
  { n: 26, data: '2024-02-10', valor: 691.95 },
  { n: 27, data: '2024-03-10', valor: 691.99 },
  { n: 28, data: '2024-04-10', valor: 692.19 },
  { n: 29, data: '2024-05-10', valor: 693.46 },
  { n: 30, data: '2024-06-10', valor: 693.46 },
  { n: 31, data: '2024-07-10', valor: 693.71 },
  { n: 32, data: '2024-08-10', valor: 694.20 },
  { n: 33, data: '2024-09-10', valor: 694.68 },
  { n: 34, data: '2024-10-10', valor: 695.13 },
  { n: 35, data: '2024-11-10', valor: 695.79 },
  { n: 36, data: '2024-12-10', valor: 696.22 },
  { n: 37, data: '2025-01-10', valor: 696.79 },
  { n: 38, data: '2025-02-10', valor: 697.95 },
  { n: 39, data: '2025-03-10', valor: 698.86 },
  { n: 40, data: '2025-04-10', valor: 699.61 },
  { n: 41, data: '2025-05-10', valor: 700.76 },
  { n: 42, data: '2025-06-10', valor: 701.96 },
  { n: 43, data: '2025-07-10', valor: 703.13 },
  { n: 44, data: '2025-08-10', valor: 704.34 },
  { n: 45, data: '2025-09-10', valor: 705.53 },
  { n: 46, data: '2025-10-10', valor: 706.74 },
  { n: 47, data: '2025-11-10', valor: 707.96 },
  { n: 48, data: '2025-12-10', valor: 709.10 },
  { n: 49, data: '2026-01-10', valor: 733.41 }, // pico TR
  { n: 50, data: '2026-02-10', valor: 711.53 },
  { n: 51, data: '2026-03-10', valor: 712.36 },
  { n: 52, data: '2026-04-10', valor: 713.59 },
  { n: 53, data: '2026-05-10', valor: 714.75 },
  { n: 54, data: '2026-06-10', valor: 715.94 },
]

const FINANCIAMENTO_ID = 'contrato-caixa-8-7877-1271835-8'

async function main() {
  console.log('🌱 Iniciando seed...')

  const ownerEmail = process.env.OWNER_EMAIL ?? 'shelton@email.com'
  const ownerSenha = process.env.OWNER_SENHA ?? 'senha123'

  // Criar usuário owner
  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      name: 'Shelton de Castro Farias',
      email: ownerEmail,
      senhaHash: await bcrypt.hash(ownerSenha, 12),
    },
  })
  console.log(`✅ Usuário criado: ${user.email}`)

  // Criar financiamento com dados reais do contrato
  const financiamento = await prisma.financiamento.upsert({
    where: { id: FINANCIAMENTO_ID },
    update: { parcelaAtual: 55 },
    create: {
      id: FINANCIAMENTO_ID,
      userId: user.id,
      descricao: 'Apt. 203 Bloco 31 — Conquista Laguna',
      banco: 'Caixa Econômica Federal',
      agencia: 'Edson Queiroz',
      numeroContrato: '8.7877.1271835-8',
      programa: 'Casa Verde e Amarela — FGTS',

      valorImovel: 163640.00,
      valorFinanciado: 126630.40,
      recursosProprios: 28138.60,
      descontoFGTS: 8871.00,

      taxaJurosNominalAnual: 4.75,   // 4,7500% a.a.
      taxaEfetivaAnual: 4.8547,
      prazoMeses: 360,
      sistemaAmort: 'PRICE',
      indiceCorrecao: 'TR',

      dataInicio: new Date('2021-12-10'), // vencimento 1ª parcela
      parcelaAtual: 55,                   // próxima: 10/07/2026

      prestacaoInicialAJ: 660.56,
      seguroMensal: 25.03,
      totalMensalInicial: 685.59,
      tarifaAdministracao: 0.00,
      garantiaFiduciaria: 158288.00,
    },
  })
  console.log(`✅ Financiamento criado: ${financiamento.numeroContrato}`)

  // Inserir as 54 parcelas pagas
  for (const p of PAGAMENTOS) {
    await prisma.parcelaPaga.upsert({
      where: {
        financiamentoId_numeroParcela: {
          financiamentoId: FINANCIAMENTO_ID,
          numeroParcela: p.n,
        },
      },
      update: { valorPago: p.valor },
      create: {
        financiamentoId: FINANCIAMENTO_ID,
        numeroParcela: p.n,
        dataVencimento: new Date(p.data),
        dataPagamentoReal: new Date(p.data),
        valorPago: p.valor,
      },
    })
  }
  console.log(`✅ ${PAGAMENTOS.length} parcelas pagas inseridas`)
  console.log(`💰 Total pago: R$ ${PAGAMENTOS.reduce((s, p) => s + p.valor, 0).toFixed(2)}`)
  console.log('🎉 Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
