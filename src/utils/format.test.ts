
import { describe, it, expect } from 'vitest';

// Função simples simulada (se você tiver uma real, importe ela)
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

describe('Format Utils', () => {
    it('deve formatar valores em Reais corretamente', () => {
        // 1. Preparação (Arrange)
        const valor = 1200.50;

        // 2. Ação (Act)
        const resultado = formatCurrency(valor);

        // 3. Verificação (Assert)
        // O espaço no R$ pode variar dependendo do sistema, usamos matching flexível
        // O espaço é frequentemente um NO-BREAK SPACE (\xa0)
        expect(resultado).toMatch(/R\$\s?1\.200,50/);
    });
});
