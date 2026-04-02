import { describe, it, expect } from 'vitest'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

describe('Format Utils', () => {
  it('deve formatar valores em Reais corretamente', () => {
    const valor = 1200.5

    const resultado = formatCurrency(valor)

    expect(resultado).toMatch(/R\$\s?1\.200,50/)
  })
})
