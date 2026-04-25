import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { logger } from '@/services/logger'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Eraser, Check, ArrowRight, FileText } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
// jsPDF lazy: só carrega quando a noiva confirma a assinatura.
import { sanitizeHTML } from '@/lib/sanitize'
import type { Contract } from '@/types/api.types'

interface DigitalSignatureProps {
  isOpen: boolean
  onClose: () => void
  contract: Contract
  onSigned: () => void
}

export function DigitalSignature({
  isOpen,
  onClose,
  contract,
  onSigned,
}: DigitalSignatureProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isSaving, setIsSaving] = useState(false)
  // Fluxo em 2 passos: preview do contrato → assinar. Força a noiva a
  // ao menos abrir o texto antes de colocar o dedo no canvas. Antes era
  // direto pro canvas — consentimento informado questionável.
  const [step, setStep] = useState<'preview' | 'sign'>('preview')
  const { toast } = useToast()

  const clear = () => {
    sigCanvas.current?.clear()
  }

  const save = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast({
        variant: 'destructive',
        title: 'Assinatura vazia',
        description: 'Por favor, desenhe sua assinatura antes de confirmar.',
      })
      return
    }

    if (!contract.project_id) {
      toast({
        title: 'Erro',
        description: 'Contrato inválido (sem projeto vinculado).',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const dataUrl = sigCanvas.current
        ?.getTrimmedCanvas()
        .toDataURL('image/png')
      if (!dataUrl) throw new Error('Failed to generate signature image')

      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('KHAOS KONTROL', 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Contrato de Prestação de Serviços - Cópia Assinada', 105, 30, {
        align: 'center',
      })
      doc.text(
        `Assinado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        105,
        35,
        { align: 'center' },
      )

      doc.setLineWidth(0.5)
      doc.line(20, 40, 190, 40)

      doc.setFontSize(11)
      const content = contract.content || 'Conteúdo do contrato não disponível.'
      const splitText = doc.splitTextToSize(content, 170)
      doc.text(splitText, 20, 50)

      let finalY = 50 + splitText.length * 5

      if (finalY > 250) {
        doc.addPage()
        finalY = 20
      }

      doc.text('Assinatura Digital:', 20, finalY + 10)
      doc.addImage(dataUrl, 'PNG', 20, finalY + 15, 60, 30)

      const pdfBlob = doc.output('blob')

      const fileName = `signed_contracts/${contract.project_id}_${contract.id}_${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('contracts').getPublicUrl(fileName)

      try {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            status: 'signed',
            signed_at: new Date().toISOString(),
            signature_data: JSON.stringify({
              pdf_url: publicUrl,
              signed_by: 'client',
            }),
          })
          .eq('id', contract.id)

        if (updateError) throw updateError
      } catch (updateError) {
        await supabase.storage.from('contracts').remove([fileName])
        throw updateError
      }

      toast({
        title: 'Contrato Assinado!',
        description: 'Documento registrado com sucesso.',
      })
      onSigned()
      onClose()
    } catch (error) {
      logger.error(error, 'DigitalSignature.save', { showToast: false })
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description:
          'Não foi possível registrar a assinatura. Tente novamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setStep('preview')
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg bg-white text-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif uppercase text-center flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            {contract.title || 'Contrato'}
          </DialogTitle>
          <DialogDescription className="text-center font-mono text-xs uppercase tracking-wider text-gray-500">
            {step === 'preview'
              ? 'Leia com atenção antes de continuar.'
              : 'Desenhe sua assinatura abaixo para aceitar.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' ? (
          <>
            <article
              className="border border-gray-200 rounded p-4 bg-gray-50 max-h-[45vh] overflow-y-auto text-sm leading-relaxed font-serif"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(contract.content || ''),
              }}
            />
            <p className="text-[10px] text-gray-400 text-center font-mono mt-2">
              Ao assinar você concorda com todos os termos acima.
            </p>
            <DialogFooter className="flex gap-2 sm:justify-center mt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 font-mono text-xs uppercase"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep('sign')}
                className="flex-1 bg-black text-white hover:bg-gray-800 font-mono text-xs uppercase"
              >
                Continuar
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-1 mt-4 bg-gray-50">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  className: 'signature-canvas w-full h-40 cursor-crosshair',
                }}
                backgroundColor="rgba(0,0,0,0)"
              />
            </div>

            <div className="text-[10px] text-gray-400 text-center font-mono mt-2">
              Ao assinar, você concorda com todos os termos do contrato.
            </div>

            <DialogFooter className="flex gap-2 sm:justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setStep('preview')}
                disabled={isSaving}
                className="flex-1 font-mono text-xs uppercase"
              >
                Ver contrato
              </Button>
              <Button
                variant="outline"
                onClick={clear}
                disabled={isSaving}
                className="flex-1 font-mono text-xs uppercase"
              >
                <Eraser className="w-3 h-3 mr-2" />
                Limpar
              </Button>
              <Button
                onClick={save}
                disabled={isSaving}
                className="flex-1 bg-black text-white hover:bg-gray-800 font-mono text-xs uppercase"
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 mr-2" />
                )}
                {isSaving ? 'Assinando...' : 'Assinar'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
