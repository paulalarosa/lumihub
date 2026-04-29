import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Editor } from '@tiptap/react'
import { useAI } from '@/hooks/useAI'
import { buildBYOKHeaders } from '@/lib/byok'

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
  event_time?: string
  budget?: number
  total_value?: number
  event_location?: string
  location?: string
  guests_count?: number
  [key: string]: unknown
}

interface ContractorProfile {
  full_name?: string
  document_id?: string
  address?: string
  city?: string
  state?: string
}

const formatCurrencyBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDateBRL = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR')

export function useSmartContractEditor(
  projectId: string | null,
  editor: Editor | null,
) {
  const { byokSettings } = useAI()
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [aiCommand, setAiCommand] = useState('')
  const [projectData, setProjectData] = useState<ContractProjectData | null>(
    null,
  )
  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [reviewResult, setReviewResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return

      const { data: project } = await supabase
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

      if (project) setProjectData(project as ContractProjectData)

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
    toast.success('Cláusula adicionada')
  }

  const buildPayload = () => {
    if (!projectData) return null
    const servicesList =
      projectData.services?.map((s) => s.service?.name).filter(Boolean).join(', ') ||
      '[A PREENCHER]'

    const price =
      projectData.total_value ?? projectData.budget
        ? formatCurrencyBRL(
            (projectData.total_value ?? projectData.budget) as number,
          )
        : '[A PREENCHER]'

    const contractorAddress = [
      contractor?.address,
      contractor?.city,
      contractor?.state,
    ]
      .filter(Boolean)
      .join(', ') || undefined

    return {
      actors: {
        contractor_name: contractor?.full_name,
        contractor_doc: contractor?.document_id,
        contractor_address: contractorAddress,
        client_name: projectData.client?.full_name,
        client_doc: projectData.client?.cpf,
        client_address: projectData.client?.address,
      },
      terms: {
        event_date: projectData.event_date
          ? formatDateBRL(projectData.event_date)
          : undefined,
        event_time: projectData.event_time,
        price,
        services: servicesList,
        location:
          projectData.event_location ?? projectData.location ?? undefined,
        guests_count: projectData.guests_count,
      },
    }
  }

  const handleGenerateTemplate = async () => {
    if (!editor || !projectData) return
    setIsAiGenerating(true)

    try {
      const payload = buildPayload()
      if (!payload) throw new Error('Dados do projeto ausentes')

      const { data, error } = await supabase.functions.invoke(
        'generate-contract-ai',
        {
          body: { mode: 'GENERATE', ...payload },
          headers: buildBYOKHeaders(byokSettings),
        },
      )
      if (error) throw error

      if (data?.text) {
        editor.commands.setContent(data.text)
        toast.success('Contrato gerado pela IA jurídica')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error('Erro na geração', { description: msg })
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
            mode: 'REFINE',
            current_text: editor.getHTML(),
            instruction: aiCommand,
          },
          headers: buildBYOKHeaders(byokSettings),
        },
      )
      if (error) throw error

      if (data?.text) {
        editor.commands.setContent(data.text)
        setAiCommand('')
        toast.success('Contrato refinado')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error('Erro no refinamento', { description: msg })
    } finally {
      setIsRefining(false)
    }
  }

  const handleReview = async () => {
    if (!editor) return
    const current = editor.getHTML()
    if (!current || editor.getText().trim().length < 20) {
      toast.info('Gere ou escreva o contrato antes de pedir revisão')
      return
    }
    setIsReviewing(true)
    setReviewResult(null)
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-contract-ai',
        {
          body: { mode: 'REVIEW', current_text: current },
          headers: buildBYOKHeaders(byokSettings),
        },
      )
      if (error) throw error
      if (data?.text) {
        setReviewResult(data.text)
        toast.success('Parecer jurídico pronto')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      toast.error('Erro na revisão', { description: msg })
    } finally {
      setIsReviewing(false)
    }
  }

  const closeReview = () => setReviewResult(null)

  return {
    isAiGenerating,
    isRefining,
    isReviewing,
    aiCommand,
    setAiCommand,
    projectData,
    insertClause,
    handleGenerateTemplate,
    handleRefine,
    handleReview,
    reviewResult,
    closeReview,
  }
}
