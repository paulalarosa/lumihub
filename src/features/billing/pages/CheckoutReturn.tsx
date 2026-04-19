import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function CheckoutReturn() {
  const [status, setStatus] = useState<'loading' | 'complete' | 'open' | 'failed'>('loading')
  const [customerEmail, setCustomerEmail] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  const hasFetched = useRef(false)
  const { trackSubscription, trackConversion } = useAnalytics()

  useEffect(() => {
    if (!sessionId || hasFetched.current) return
    hasFetched.current = true

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId },
        })

        if (error) throw error

        if (data.status === 'open') {
          setStatus('open')
        } else if (data.status === 'complete' || data.success) {
          setStatus('complete')
          setCustomerEmail(data.customer_email)
          trackSubscription('subscribe', data.plan, data.amount)
          trackConversion({
            conversion_id: 'subscription_completed',
            transaction_id: sessionId ?? undefined,
            value: data.amount,
            currency: 'BRL',
          })
        } else {
          setStatus('failed')
        }
      } catch (err) {
        logger.error(err, 'CheckoutReturn.fetchSession')
        setStatus('failed')
      }
    }

    fetchSession()
  }, [sessionId, trackSubscription, trackConversion])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-white/40 animate-spin mx-auto" />
          <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
            Verificando pagamento...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'open') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-10 text-center space-y-4">
          <p className="font-serif text-2xl text-white">Pagamento pendente</p>
          <p className="text-white/40 text-sm">Seu pagamento ainda está sendo processado.</p>
          <Button variant="outline" onClick={() => navigate('/planos')}>
            Voltar aos planos
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-red-500/20 bg-red-950/10 p-10 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="font-serif text-2xl text-white">Falha no pagamento</p>
          <p className="text-white/40 text-sm">
            Não foi possível confirmar seu pagamento. Tente novamente.
          </p>
          <Button variant="primary" onClick={() => navigate('/planos')}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-10 text-center space-y-6">
        <CheckCircle2 className="w-12 h-12 text-white mx-auto" />
        <div className="space-y-2">
          <p className="font-serif text-2xl text-white">Assinatura confirmada!</p>
          <p className="text-white/40 text-sm">
            Obrigada por assinar o Khaos Kontrol.
            {customerEmail && (
              <> Um email de confirmação foi enviado para <strong className="text-white">{customerEmail}</strong>.</>
            )}
          </p>
        </div>
        <Button variant="primary" className="w-full" onClick={() => navigate('/dashboard')}>
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  )
}
