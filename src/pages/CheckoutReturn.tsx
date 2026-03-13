import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'

export const CheckoutReturn = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  )
  const [message, setMessage] = useState('Verificando status do pagamento...')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      setMessage('Sessão inválida.')
      return
    }

    const verifySession = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'verify-payment',
          {
            body: { sessionId },
          },
        )

        if (error) throw error
        if (data.error) throw new Error(data.error)

        if (data.success) {
          setStatus('success')
          setMessage(`Assinatura confirmada! Plano ${data.plan} ativado.`)
        } else {
          setStatus('error')
          setMessage('Pagamento não confirmado. Tente novamente.')
        }
      } catch (err: unknown) {
        logger.error('Verification error:', err)

        setStatus('error')
        setMessage(
          'Erro ao verificar pagamento. Entre em contato com o suporte.',
        )
      }
    }

    verifySession()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-neutral-900 border-neutral-800 text-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processando...'}
            {status === 'success' && 'Pagamento Confirmado!'}
            {status === 'error' && 'Algo deu errado'}
          </CardTitle>
          <CardDescription className="text-neutral-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status !== 'loading' && (
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full"
            >
              Ir para o Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
