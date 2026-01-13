import { useState } from 'react';

export function useAIContract() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateContract = async (prompt: string): Promise<string> => {
        setIsGenerating(true);
        // Simulate AI delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const template = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS 

CONTRATANTE: [Nome do Cliente], doravante denominado CONTRATANTE.
CONTRATADO: [Nome do Profissional], doravante denominado CONTRATADO.

OBJETO:
O presente contrato tem por objeto a prestação de serviços de beleza e estética para a ocasião: ${prompt.toUpperCase()}.

CLÁUSULA 1 - DOS SERVIÇOS
Os serviços contratados incluem: [Listar serviços detalhados].

CLÁUSULA 2 - DOAGENDAMENTO E ATRASOS
O atendimento será realizado no dia [Data] às [Hora]. Tolera-se atraso máximo de 15 minutos.

CLÁUSULA 3 - DO CANCELAMENTO
Cancelamentos devem ser feitos com 48h de antecedência. Em caso de não comparecimento (no-show), será cobrada taxa de 50%.

Local e Data: ______________________, ___/___/___

__________________________
Assinatura do Contratante
`;
        setIsGenerating(false);
        return template.trim();
    };

    const refineText = async (text: string): Promise<string> => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsGenerating(false);
        return text + "\n\n[Cláusula refinada pela Lumi AI com linguagem jurídica formal]";
    };

    return {
        generateContract,
        refineText,
        isGenerating
    };
}
