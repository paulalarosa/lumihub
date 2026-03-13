import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
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

export default function Return() {
  const [status, setStatus] = useState<string | null>(null)
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!sessionId || hasFetched.current) return

    hasFetched.current = true // Prevent double fetch in React Strict Mode

    const fetchSession = async () => {
      // We can optionally verify here via usage of stripe.checkout.sessions.retrieve
      // But usually for valid session_id we just trust the redirect state provided the webhook handles the rest.
      // Ideally calls a "verify" endpoint if we want immediate feedback.
      // Given the prompt requirement: "Exibir um estado de 'Processando' enquanto verifica o status da sessão."

      try {
        // Let's call our verify-payment edge function again, or just wait.
        // Re-using verify-payment logic is good for immediate UI feedback.
        // Assuming verify-payment is still relevant or we should fetch session status from Stripe directly?
        // The prompt says "Mostrar mensagem de sucesso ou erro baseada no retorno da Stripe."

        // Let's use verify-payment logic if it exists, otherwise just show success.
        // I will use verify-payment as it is robust.

        const { data, error } = await supabase.functions.invoke(
          'verify-payment',
          {
            body: { sessionId },
          },
        )

        if (error) throw error
        if (data.status === 'open') {
          setStatus('open')
        } else if (data.status === 'complete' || data.success) {
          setStatus('complete')
          setCustomerEmail(data.customer_email)
        } else {
          setStatus('failed')
        }
      } catch (err) {
        logger.error(err)
        setStatus('failed')
      }
    }

    fetchSession()
  }, [sessionId])

  if (status === 'open') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-neutral-900 border-neutral-800 text-white">
          <CardHeader>
            <CardTitle>Pagamento Pendente</CardTitle>
            <CardDescription>
              Seu pagamento ainda está sendo processado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-neutral-900 border-neutral-800 text-white">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle>Falha no Pagamento</CardTitle>
            <CardDescription>
              Não foi possível confirmar seu pagamento. Tente novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/planos')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'complete') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-neutral-900 border-neutral-800 text-white">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Assinatura Confirmada!</CardTitle>
            <CardDescription>
              Obrigado por assinar o Khaos Kontrol.
              {customerEmail && <br />} Um email de confirmação foi enviado para{' '}
              {customerEmail}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-neutral-900 border-neutral-800 text-white">
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Processando seu pagamento...</p>
        </CardContent>
      </Card>
    </div>
  )
}
