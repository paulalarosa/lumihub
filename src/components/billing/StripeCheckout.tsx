import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { handleError } from '@/lib/error-handling'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface StripeCheckoutProps {
  planType: string
}

export function StripeCheckout({ planType }: StripeCheckoutProps) {
  const { user } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchClientSecret = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.functions.invoke(
          'create-checkout-session',
          {
            body: { plan_type: planType, user_id: user.id },
          },
        )

        if (error) throw error
        if (data.error) throw new Error(data.error)

        setClientSecret(data.clientSecret)
      } catch (err: unknown) {
        handleError(err, 'StripeCheckout:fetchClientSecret')
        const message =
          err instanceof Error ? err.message : 'Failed to initialize checkout.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchClientSecret()
  }, [planType, user])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (loading || !clientSecret) {
    return (
      <Card className="w-full bg-[#1A1A1A] border-white/10">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 bg-white/5" />
          <Skeleton className="h-4 w-1/2 bg-white/5 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full bg-white/5 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout className="bg-[#1A1A1A]" />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
