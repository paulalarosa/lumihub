import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
import { Eraser, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signatureData: string) => void
  isLoading?: boolean
}

export function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const confirm = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      // Get signature as base64 image (transparent PNG with white ink)
      const dataURL = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL('image/png')
      onConfirm(dataURL)
    }
  }

  const handleDrawStart = () => {
    setIsEmpty(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#050505] border border-neutral-800 text-white p-0 sm:max-w-xl shadow-2xl overflow-hidden rounded-none">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 bg-[#0a0a0a]">
          <DialogTitle className="text-xl font-serif italic text-white flex items-center justify-between">
            <span>Assinatura Digital</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans font-normal border border-neutral-800 px-2 py-1 rounded-none">
              Legal Binding
            </span>
          </DialogTitle>
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-wider mt-2">
            Por favor, assine no campo abaixo
          </p>
        </div>

        {/* Canvas Area */}
        <div className="p-1 bg-[#151515] relative group">
          <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-50">
            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">
              X __________________________
            </span>
          </div>

          <div className="border border-neutral-800 bg-black cursor-crosshair">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="white"
              backgroundColor="black"
              canvasProps={{
                className: 'w-full h-[300px] touch-none',
              }}
              onBegin={handleDrawStart}
              velocityFilterWeight={0.7}
              minWidth={1}
              maxWidth={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#0a0a0a] border-t border-neutral-800 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={clear}
            className="text-neutral-500 hover:text-white hover:bg-transparent uppercase tracking-widest text-xs font-mono"
            disabled={isLoading || isEmpty}
          >
            <Eraser className="w-4 h-4 mr-2" />
            Limpar
          </Button>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="text-neutral-400 hover:text-white rounded-none uppercase tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirm}
              disabled={isLoading || isEmpty}
              className={cn(
                'bg-white text-black hover:bg-neutral-200 rounded-none uppercase tracking-widest text-xs font-bold transition-all px-6',
                isEmpty && 'opacity-50 cursor-not-allowed',
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
