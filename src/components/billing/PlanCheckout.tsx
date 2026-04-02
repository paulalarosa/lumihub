import { useCallback, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { toast } from 'sonner'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

interface PlanCheckoutProps {
  priceId: string
}

export const PlanCheckout = ({ priceId }: PlanCheckoutProps) => {
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const fetchClientSecret = useCallback(async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId,
            userId: user.id,
            planName: 'make_plan_dynamic_later',
          },
        },
      )

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      return data.clientSecret
    } catch (err: unknown) {
      logger.error('Error creating checkout session:', err)
      setError(
        err instanceof Error ? err.message : 'Erro ao iniciar o pagamento',
      )
      toast.error('Erro ao iniciar o checkout. Tente novamente.')
      return null
    }
  }, [priceId, user])

  useEffect(() => {}, [])

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-900 rounded-lg text-red-200">
        <p>Não foi possível carregar o checkout.</p>
        <p className="text-sm opacity-75">{error}</p>
      </div>
    )
  }

  const options = { fetchClientSecret }

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden shadow-xl min-h-[400px]">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout className="h-full w-full" />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
