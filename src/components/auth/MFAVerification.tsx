import { useState, useEffect } from 'react'
import { useMFA } from '@/hooks/useMFA'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { logger } from '@/services/logger'

export default function MFAVerification({
  onSuccess,
}: {
  onSuccess?: () => void
}) {
  const { listFactors, challenge, verify, isLoading } = useMFA()
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const factors = await listFactors()
      const totpFactor = factors.find(
        (f) => f.factor_type === 'totp' && f.status === 'verified',
      )
      if (totpFactor) {
        setFactorId(totpFactor.id)
      } else {
        toast.error(
          'Nenhum método MFA encontrado. Entre em contato com o suporte.',
        )
      }
    }
    init()
  }, [listFactors])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId || code.length !== 6) return

    setIsVerifying(true)
    try {
      const challengeData = await challenge(factorId)
      if (challengeData) {
        const verifyData = await verify(factorId, challengeData.id, code)
        if (verifyData) {
          toast.success('Verificado com sucesso!')
          if (onSuccess) onSuccess()
          else navigate('/admin', { replace: true })
        }
      }
    } catch (error) {
      logger.error(error, 'MFAVerification.handleVerify', { showToast: false })
      toast.error('Código inválido. Tente novamente.')
    } finally {
      setIsVerifying(false)
    }
  }

  if (isLoading && !factorId) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-card border rounded-lg shadow-lg">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="p-3 bg-primary/10 rounded-full">
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Verificação de Segurança
        </h1>
        <p className="text-sm text-muted-foreground">
          Digite o código de 6 dígitos do seu aplicativo autenticador.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="sr-only">
            Código de Verificação
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="000 000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="text-center text-2xl tracking-[0.5em] h-14"
            disabled={isVerifying}
            autoFocus
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={code.length !== 6 || isVerifying || !factorId}
        >
          {isVerifying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            'Verificar'
          )}
        </Button>
      </form>
    </div>
  )
}
