import { useRef, useState } from 'react'
import SignaturePad from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser, Check } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void
  onCancel?: () => void
}

export function SignatureCanvas({ onSave, _onCancel }: SignatureCanvasProps) {
  const padRef = useRef<SignaturePad>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const clear = () => {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      const dataUrl = padRef.current.getTrimmedCanvas().toDataURL('image/png')
      onSave(dataUrl)
    }
  }

  const handleEnd = () => {
    if (padRef.current) {
      setIsEmpty(padRef.current.isEmpty())
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-white/20 rounded-xl overflow-hidden bg-white/5">
        <SignaturePad
          ref={padRef}
          canvasProps={{
            className: 'w-full h-64 cursor-crosshair',
            style: { width: '100%', height: '256px' },
          }}
          onEnd={handleEnd}
          penColor="#ffffff"
          backgroundColor="rgba(0,0,0,0)" // Transparent
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={clear}
          disabled={isEmpty}
          className="border-white/10 text-white/70 hover:bg-white/5"
        >
          <Eraser className="w-4 h-4 mr-2" />
          Limpar
        </Button>
        <Button
          onClick={save}
          disabled={isEmpty}
          className="bg-white hover:bg-white/90 text-black font-medium"
        >
          <Check className="w-4 h-4 mr-2" />
          Confirmar Assinatura
        </Button>
      </div>
      {isEmpty && (
        <p className="text-xs text-center text-white/30">
          Assine na área acima usando o dedo ou mouse.
        </p>
      )}
    </div>
  )
}
