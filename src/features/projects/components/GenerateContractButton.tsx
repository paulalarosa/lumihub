import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { ContractTemplate } from '@/features/contracts/components/ContractTemplate'

import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useState } from 'react'
import { Logger } from '@/services/logger'
import { useOrganization } from '@/hooks/useOrganization'

interface GenerateContractButtonProps {
  projectId: string
}

export const GenerateContractButton = ({
  projectId,
}: GenerateContractButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const { organizationId } = useOrganization()

  const handleGenerate = async () => {
    setIsGenerating(true)

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select(
          `
          *,
          client:wedding_clients(*),
          services:project_services(*)
        `,
        )
        .eq('id', projectId)
        .single()

      if (error) throw error
      if (!project) throw new Error('Projeto não encontrado')

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: makeupArtist } = await supabase
        .from('makeup_artists')
        .select('*')
        .eq('user_id', organizationId ?? user?.id)
        .single()

      const contractData = {
        contractNumber: `KHAOS-${project.id.substring(0, 8).toUpperCase()}`,
        makeupArtist: {
          name: makeupArtist?.business_name || 'Nome da Maquiadora',
          cpf: makeupArtist?.cpf || '000.000.000-00',
          address: makeupArtist?.address || 'Endereço da Maquiadora',
          phone: makeupArtist?.phone || '(00) 00000-0000',
          email: user?.email || 'email@exemplo.com',
        },
        client: {
          name: (project.client as Record<string, unknown>).full_name as string,
          cpf: project.client.cpf || '000.000.000-00',
          address: project.client.address || 'Endereço do Cliente',
          phone: project.client.phone || '(00) 00000-0000',
          email: project.client.email || 'email@exemplo.com',
        },
        event: {
          date: new Date(project.event_date),
          time: project.event_time || '14:00',
          location: project.event_location || 'Local do Evento',
          type:
            project.service_type === 'wedding' ? 'Casamento' : 'Evento Social',
        },
        services: project.services.map((s: Record<string, unknown>) => ({
          description: s.service_name,
          quantity: s.quantity || 1,
          unitPrice: s.unit_price,
          total: s.total_price,
        })),
        payment: {
          total: project.total_value,
          deposit: project.deposit_amount || project.total_value * 0.5,
          remaining:
            project.total_value -
            (project.deposit_amount || project.total_value * 0.5),
          paymentMethod: 'PIX / Transferência Bancária',
          dueDate: new Date(project.event_date),
        },
      }

      const doc = <ContractTemplate data={contractData} />
      const asPdf = pdf(doc)
      const blob = await asPdf.toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contrato-${((project.client as Record<string, unknown>).full_name as string).toLowerCase().replace(/\s/g, '-')}.pdf`
      link.click()

      await supabase
        .from('projects')
        .update({ contract_generated_at: new Date().toISOString() })
        .eq('id', projectId)

      await Logger.action(
        'CONTRACT_GENERATION',
        user?.id || 'SYSTEM',
        'projects',
        projectId,
        { contractNumber: contractData.contractNumber },
        'GenerateContractButton',
      )

      toast.success('Contrato gerado com sucesso!')
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error('Erro ao gerar contrato: ' + message)
      await Logger.error('CONTRACT_GENERATION_FAILED', error, undefined, {
        projectId,
      })
    } finally {
      setIsGenerating(false)
    }
  }

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
  )
}
