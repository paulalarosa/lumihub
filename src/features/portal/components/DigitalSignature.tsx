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
import { Loader2, Eraser, Check } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
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
      // 1. Get Signature Image
      const dataUrl = sigCanvas.current
        ?.getTrimmedCanvas()
        .toDataURL('image/png')
      if (!dataUrl) throw new Error('Failed to generate signature image')

      // 2. Generate PDF with Signature
      const doc = new jsPDF()

      // Header
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

      // Content
      doc.setFontSize(11)
      const content = contract.content || 'Conteúdo do contrato não disponível.'
      const splitText = doc.splitTextToSize(content, 170)
      doc.text(splitText, 20, 50)

      // Add Signature Image at the bottom
      // Calculate Y position based on text length, or just put it at the end/new page
      // For simplicity, we'll maintain simple flow or add page if needed.
      // Here we just put it somewhat below the text.
      let finalY = 50 + splitText.length * 5 // Approx height

      if (finalY > 250) {
        doc.addPage()
        finalY = 20
      }

      doc.text('Assinatura Digital:', 20, finalY + 10)
      doc.addImage(dataUrl, 'PNG', 20, finalY + 15, 60, 30)

      const pdfBlob = doc.output('blob')

      // 3. Upload Signed PDF
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

      // 4. Update Contract Status
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

      toast({
        title: 'Contrato Assinado! ✅',
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-black">
        <DialogHeader>
          <DialogTitle className="font-serif uppercase text-center">
            Confirmar Assinatura
          </DialogTitle>
          <DialogDescription className="text-center font-mono text-xs uppercase tracking-wider text-gray-500">
            Desenhe sua assinatura abaixo para aceitar os termos.
          </DialogDescription>
        </DialogHeader>

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
            {isSaving ? 'Assinando...' : 'Assinar Agora'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
