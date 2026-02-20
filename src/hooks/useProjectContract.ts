import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { v4 as uuidv4 } from 'uuid'
import html2pdf from 'html2pdf.js'
import type { Tables } from '@/types/supabase'
import type { Editor } from '@tiptap/react'

interface ProjectData {
  id: string
  name: string
  status: string
  notes?: string | null
}

interface ContractData extends Omit<Tables<'contracts'>, 'signature_data'> {
  signature_data: string | null
}

export type { ProjectData, ContractData }

interface UseProjectContractProps {
  projectId: string | undefined
  isClientView: boolean
  editor: Editor | null
}

export function useProjectContract({
  projectId,
  isClientView: _isClientView,
  editor,
}: UseProjectContractProps) {
  const { toast } = useToast()

  const [project, setProject] = useState<ProjectData | null>(null)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedSuccess, setSignedSuccess] = useState(false)
  const [finalPdfUrl, setFinalPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        setLoading(false)
        return
      }

      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, status, notes')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle()

        if (contractError && contractError.code !== 'PGRST116') {
          throw contractError
        }

        if (contractData) {
          setContract(contractData)
          if (contractData.status === 'signed') {
            setSignedSuccess(true)
            if (contractData.signature_data) {
              try {
                const parsed =
                  typeof contractData.signature_data === 'string'
                    ? JSON.parse(contractData.signature_data)
                    : contractData.signature_data
                if (parsed?.pdf_url) setFinalPdfUrl(parsed.pdf_url)
              } catch (_) {
                /* ignore parse errors */
              }
            }
          }
        }

        const savedContent = localStorage.getItem(`contract_${projectId}`)
        const contentToLoad = savedContent || contractData?.content || ''
        if (editor && contentToLoad) {
          editor.commands.setContent(contentToLoad)
        }
      } catch (_error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o contrato.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, editor, toast])

  const handleGenerateSignatureLink = async () => {
    if (!projectId) return
    const signatureUrl = `${window.location.origin}/projects/${projectId}/contract?mode=client`

    try {
      await navigator.clipboard.writeText(signatureUrl)
      toast({
        title: 'Sucesso!',
        description: 'Link de assinatura copiado para a área de transferência.',
      })
    } catch (_) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link.',
        variant: 'destructive',
      })
    }
  }

  const getClientIP = () => 'IP Logged by Server'

  const buildSignatureBlock = (
    signatureDataUrl: string,
    signedAt: string,
    contractHash: string,
  ) => `
    <div style="margin-top: 60px; page-break-inside: avoid; background-color: #000; color: #fff; padding: 30px; border: 1px solid #333;">
        <div style="display: flex; justify-content: space-between; gap: 20px;">
                <p style="font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; color: #666;">AUTENTICADO POR KHAOS STUDIO<br/>Paula Larosa</p>
            </div>
            <div style="flex: 1; border-right: 1px solid #333; padding-right: 20px; padding-left: 20px;">
                <p style="font-family: 'Playfair Display', serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; color: #888;">Contratante</p>
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #333; margin-bottom: 10px;">
                    <img src="${signatureDataUrl}" style="max-height: 50px; filter: invert(1);" />
                </div>
                <p style="font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; color: #666;">ASSINATURA DIGITAL DA CLIENTE<br/>IP: ${getClientIP()} | ${signedAt}</p>
            </div>
            <div style="flex: 1; padding-left: 20px; display: flex; flex-col; justify-content: flex-end; align-items: flex-start;">
                <div style="border: 1px solid #fff; padding: 10px; width: 100%;">
                    <p style="font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; color: #888; margin-bottom: 5px;">System ID</p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 10px; color: #fff; word-break: break-all;">${contractHash}</p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; color: #666; margin-top: 10px;">CERTIFICADO POR<br/>KONTROL SYSTEM</p>
                </div>
            </div>
        </div>
        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 10px; text-align: center;">
             <p style="font-family: 'Inter', sans-serif; font-size: 8px; text-transform: uppercase; color: #444; letter-spacing: 3px;">SECURE DIGITAL TRANSACTION • KHAOSKONTROL.COM.BR</p>
        </div>
    </div>
  `

  const handleConfirmSignature = async (signatureDataUrl: string) => {
    setIsSubmitting(true)
    setIsSignatureModalOpen(false)

    try {
      const contractHTML = editor?.getHTML() || ''
      const signedAt = format(new Date(), 'dd/MM/yyyy HH:mm:ss', {
        locale: ptBR,
      })
      const contractHash = uuidv4()
        .replace(/-/g, '')
        .toUpperCase()
        .substring(0, 16)
      const signatureBlock = buildSignatureBlock(
        signatureDataUrl,
        signedAt,
        contractHash,
      )

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'contract_signed', {
          event_category: 'engagement',
          event_label: projectId,
        })
      }

      const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Times New Roman',serif;line-height:1.6;color:#000;padding:40px;}p{margin:10px 0;}h1{font-size:24px;margin:20px 0;}h2{font-size:18px;margin:15px 0;}ul,ol{margin:10px 0 10px 20px;}li{margin:5px 0;}</style></head><body>${contractHTML}${signatureBlock}</body></html>`

      const opt = {
        margin: 10,
        filename: `${project?.name || 'contrato'}_assinado.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      }

      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        html2pdf()
          .set(opt as Record<string, unknown>)
          .from(fullHTML)
          .toPdf()
          .output('blob')
          .then((blob: Blob) => resolve(blob))
          .catch((err: Error) => reject(err))
      })

      const fileName = `contracts/${projectId}/${Date.now()}_signed.pdf`
      const { error: uploadError } = await supabase.storage
        .from('briefing-files')
        .upload(fileName, pdfBlob, { cacheControl: '3600', upsert: false })
      if (uploadError) throw new Error('Falha no upload do contrato.')

      const { data: urlData } = supabase.storage
        .from('briefing-files')
        .getPublicUrl(fileName)

      const signaturePayload = {
        signed_at: new Date().toISOString(),
        ip_address: getClientIP(),
        pdf_url: urlData.publicUrl,
        contract_hash: contractHash,
        signature_base64_snippet: signatureDataUrl.substring(0, 50) + '...',
      }

      if (contract) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            content: contractHTML,
            status: 'signed',
            signature_data: JSON.stringify(signaturePayload),
            signed_at: new Date().toISOString(),
            signature_url: fileName,
          })
          .eq('id', contract.id)
        if (updateError) throw updateError
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('contracts').insert({
            project_id: projectId!,
            user_id: user.id,
            title: `Contrato - ${project?.name}`,
            content: contractHTML,
            status: 'signed',
            signature_data: JSON.stringify(signaturePayload),
            signed_at: new Date().toISOString(),
          })
        }
      }

      setFinalPdfUrl(urlData.publicUrl)
      setSignedSuccess(true)
      if (project) setProject({ ...project, status: 'signed' })

      toast({
        title: 'CONTRATO SELADO',
        description: 'Sua cópia assinada já está disponível.',
        className: 'bg-black text-white border-neutral-800 font-mono',
      })
    } catch (_error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o contrato. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (finalPdfUrl) {
      window.open(finalPdfUrl, '_blank')
      return
    }
    if (!editor) return

    try {
      const html = editor.getHTML()
      const opt = {
        margin: 10,
        filename: `${project?.name || 'contrato'}_draft.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      }
      html2pdf().set(opt).from(html).save()
    } catch (_) {
      /* ignore */
    }
  }

  return {
    project,
    loading,
    signedSuccess,
    isSignatureModalOpen,
    setIsSignatureModalOpen,
    isSubmitting,
    finalPdfUrl,
    handleGenerateSignatureLink,
    handleConfirmSignature,
    handleDownloadPDF,
  }
}
