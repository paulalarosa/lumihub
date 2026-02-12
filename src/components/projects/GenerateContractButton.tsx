import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ContractTemplate } from '../contracts/ContractTemplate';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Logger } from '@/services/logger';

interface GenerateContractButtonProps {
    projectId: string;
}

export const GenerateContractButton = ({ projectId }: GenerateContractButtonProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);

        try {
            // 1. Buscar dados do projeto
            const { data: project, error } = await supabase
                .from('projects')
                .select(`
          *,
          client:wedding_clients(*),
          services:project_services(*)
        `)
                .eq('id', projectId)
                .single();

            if (error) throw error;
            if (!project) throw new Error('Projeto não encontrado');

            // 2. Buscar dados da maquiadora
            const { data: { user } } = await supabase.auth.getUser();
            const { data: makeupArtist } = await supabase
                .from('makeup_artists')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            // 3. Montar dados do contrato
            const contractData = {
                contractNumber: `KHAOS-${project.id.substring(0, 8).toUpperCase()}`,
                makeupArtist: {
                    name: makeupArtist?.business_name || 'Nome da Maquiadora',
                    cpf: '000.000.000-00', // TODO: Add CPF to makeup_artists table if available
                    address: 'Endereço da Maquiadora', // TODO: Add address to makeup_artists
                    phone: makeupArtist?.phone || '(00) 00000-0000',
                    email: user?.email || 'email@exemplo.com',
                },
                client: {
                    name: project.client.name,
                    cpf: project.client.cpf || '000.000.000-00',
                    address: project.client.address || 'Endereço do Cliente',
                    phone: project.client.phone || '(00) 00000-0000',
                    email: project.client.email || 'email@exemplo.com',
                },
                event: {
                    date: new Date(project.event_date),
                    time: project.event_time || '14:00',
                    location: project.event_location || 'Local do Evento',
                    type: project.service_type === 'wedding' ? 'Casamento' : 'Evento Social',
                },
                services: project.services.map((s: any) => ({
                    description: s.service_name,
                    quantity: s.quantity || 1,
                    unitPrice: s.unit_price,
                    total: s.total_price,
                })),
                payment: {
                    total: project.total_value,
                    deposit: project.deposit_amount || (project.total_value * 0.5),
                    remaining: project.total_value - (project.deposit_amount || (project.total_value * 0.5)),
                    paymentMethod: 'PIX / Transferência Bancária',
                    dueDate: new Date(project.event_date),
                },
            };

            // 4. Gerar PDF
            const doc = <ContractTemplate data={contractData} />;
            const asPdf = pdf(doc);
            const blob = await asPdf.toBlob();

            // 5. Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `contrato-${project.client.name.toLowerCase().replace(/\s/g, '-')}.pdf`;
            link.click();

            // 6. Log e Update
            await supabase
                .from('projects')
                .update({ contract_generated_at: new Date().toISOString() })
                .eq('id', projectId);

            await Logger.action(
                'CONTRACT_GENERATION',
                { projectId, contractNumber: contractData.contractNumber },
                'Contrato PDF gerado manualmente',
                'GenerateContractButton'
            );

            toast.success('Contrato gerado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao gerar contrato:', error);
            toast.error('Erro ao gerar contrato: ' + error.message);
            await Logger.error(
                'CONTRACT_GENERATION_FAILED',
                error,
                { projectId }
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
        >
            {isGenerating ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Gerando...
                </>
            ) : (
                <>
                    <FileText className="w-4 h-4" />
                    Gerar Contrato (PDF)
                    <Download className="w-3 h-3" />
                </>
            )}
        </Button>
    );
};
