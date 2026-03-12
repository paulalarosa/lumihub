import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Editor } from '@tiptap/react'

interface ContractProjectData {
  client?: {
    full_name?: string
    email?: string
    phone?: string
    cpf?: string
    address?: string
  }
  services?: Array<{ service?: { name?: string } }>
  event_date?: string
  budget?: number
  event_location?: string
  [key: string]: unknown
}

interface ContractorProfile {
  full_name?: string
  document_id?: string
  address?: string
  city?: string
  state?: string
}

export function useSmartContractEditor(
  projectId: string | null,
  editor: Editor | null,
) {
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [aiCommand, setAiCommand] = useState('')
  const [projectData, setProjectData] = useState<ContractProjectData | null>(
    null,
  )
  const [contractor, setContractor] = useState<ContractorProfile | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(
          `
          *,
          client:wedding_clients (full_name, email, phone, cpf, address),
          services:project_services (service:services (name))
        `,
        )
        .eq('id', projectId)
        .single()

      if (!projectError && project) {
        setProjectData(project as unknown as ContractProjectData)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, document_id, address, city, state')
          .eq('id', user.id)
          .single()
        setContractor(profile as ContractorProfile | null)
      }
    }

    fetchData()
  }, [projectId, editor])

  const insertClause = (title: string, text: string) => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertContent(`<h3>${title}</h3><p>${text}</p>`)
      .run()
    toast.success('Cláusula adicionada!')
  }

  const handleGenerateTemplate = async () => {
    if (!editor || !projectData) return
    setIsAiGenerating(true)

    try {
      const servicesList =
        projectData.services?.map((s) => s.service?.name).join(', ') ||
        'Serviços Gerais'

      const payload = {
        mode: 'ARCHITECT',
        actors: {
          contractor_name: contractor?.full_name || 'KHAOS SYSTEMS (Prestador)',
          contractor_doc: contractor?.document_id || '000.000.000-00',
          client_name: projectData.client?.full_name || 'Cliente',
          client_doc: projectData.client?.cpf || '000.000.000-00',
        },
        terms: {
          date: projectData.event_date
            ? new Date(projectData.event_date).toLocaleDateString('pt-BR')
            : 'A Definir',
          price: projectData.budget
            ? projectData.budget.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            : 'R$ 0,00',
          services: servicesList,
          location: projectData.event_location || 'Local a Definir',
        },
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-contract-ai',
        { body: payload },
      )
      if (error) throw error

      if (data?.text) {
        editor.commands.setContent(data.text)
        toast.success('Contrato Gerado pela Khaos IA', {
          description: 'Estrutura jurídica aplicada com sucesso.',
        })
      }
    } catch (_) {
      toast.error('Erro na geração', {
        description: 'Verifique sua conexão ou tente novamente.',
      })
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleRefine = async () => {
    if (!editor || !aiCommand.trim()) return
    setIsRefining(true)

    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-contract-ai',
        {
          body: {
            mode: 'EDITOR',
            current_text: editor.getHTML(),
            instruction: aiCommand,
          },
        },
      )

      if (error) throw error

      if (data?.text) {
        editor.commands.setContent(data.text)
        setAiCommand('')
        toast.success('Contrato Refinado', {
          description: 'Alterações aplicadas pela Khaos IA.',
        })
      }
    } catch (_) {
      toast.error('Erro na refinamento')
    } finally {
      setIsRefining(false)
    }
  }

  return {
    isAiGenerating,
    isRefining,
    aiCommand,
    setAiCommand,
    projectData,
    insertClause,
    handleGenerateTemplate,
    handleRefine,
  }
}
