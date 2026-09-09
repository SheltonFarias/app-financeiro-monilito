import test from 'node:test'
import assert from 'node:assert'
import { calcularPRICEPuro, simularAmortizacaoExtra } from './price'

test('calcularPRICEPuro deve calcular 12 parcelas corretamente', () => {
  const input = {
    valorFinanciado: 100000,
    taxaJurosNominalAnual: 10,
    prazoMeses: 12,
    seguroMensal: 50,
    dataInicio: new Date('2024-01-01T00:00:00.000Z')
  }

  const tabela = calcularPRICEPuro(input)
  
  assert.strictEqual(tabela.length, 12, 'Deve ter 12 parcelas')
  assert.ok(tabela[11].saldoDevedor < 1, 'Saldo final deve ser zero')
  
  // A prestação PRICE (sem seguro) para 100k a 10% a.a. (0.8333% a.m.) em 12 meses
  // i = 0.008333333333333333
  // pmt = 100000 * 0.008333 * (1.008333)^12 / ((1.008333)^12 - 1) =~ 8791.59
  assert.ok(Math.abs(tabela[0].prestacao - 8841.59) < 1, 'Prestação deve incluir seguro e bater com a fórmula (aprox 8841)')
})

test('simularAmortizacaoExtra REDUZ_PRAZO deve encurtar o prazo', () => {
  const input = {
    valorFinanciado: 100000,
    taxaJurosNominalAnual: 10,
    prazoMeses: 120,
    seguroMensal: 50,
    dataInicio: new Date('2024-01-01T00:00:00.000Z')
  }

  const tabela = calcularPRICEPuro(input)
  
  // Simular um aporte grande na parcela 10
  const resultado = simularAmortizacaoExtra(tabela, 10, 50000, 'REDUZ_PRAZO', input)

  assert.ok(resultado.mesesEconomizados > 0, 'Deve economizar meses')
  assert.ok(resultado.economiaJuros > 0, 'Deve economizar juros')
  
  // Data projetada deve ser menor que a original
  assert.ok(
    resultado.dataProjetadaQuitacao!.getTime() < resultado.dataOriginalQuitacao!.getTime(),
    'Data projetada deve ser anterior à original'
  )
})

test('simularAmortizacaoExtra REDUZ_PRESTACAO deve reduzir o PMT', () => {
  const input = {
    valorFinanciado: 100000,
    taxaJurosNominalAnual: 10,
    prazoMeses: 120,
    seguroMensal: 50,
    dataInicio: new Date('2024-01-01T00:00:00.000Z')
  }

  const tabela = calcularPRICEPuro(input)
  
  const prestacaoOriginal = tabela[10].prestacao

  // Simular um aporte na parcela 10
  const resultado = simularAmortizacaoExtra(tabela, 10, 20000, 'REDUZ_PRESTACAO', input)

  assert.strictEqual(resultado.mesesEconomizados, 0, 'Não deve reduzir meses')
  assert.ok(resultado.novaPrestacao! < prestacaoOriginal, 'Nova prestação deve ser menor que a original')
  assert.ok(resultado.economiaJuros > 0, 'Deve economizar juros')
  assert.strictEqual(
    resultado.dataProjetadaQuitacao!.getTime(),
    resultado.dataOriginalQuitacao!.getTime(),
    'Data projetada deve ser igual à original'
  )
})
