import { loadStripe } from '@stripe/stripe-js'
import { logger } from '@/services/logger'

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY) {
  logger.error(new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY'), {
    message: 'Erro de configuração do sistema de pagamento.',
    showToast: false,
  })
}

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

interface CheckoutOptions {
  priceId: string
  projectId?: string
  successUrl?: string
  cancelUrl?: string
}

export const StripeService = {
  async checkout({
    priceId,
    projectId,
    successUrl,
    cancelUrl,
  }: CheckoutOptions) {
    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe Failed to Initialize')
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl:
          successUrl || 'https://khaoskontrol.com.br/dashboard?payment=success',
        cancelUrl:
          cancelUrl ||
          'https://khaoskontrol.com.br/dashboard?payment=cancelled',
        clientReferenceId: projectId,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      logger.error(error, {
        message: 'Não foi possível iniciar o pagamento. Tente novamente.',
        context: { priceId, projectId },
      })
      throw error
    }
  },
}
