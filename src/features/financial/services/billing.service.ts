import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'

export interface BillingHistoryItem {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible'
  date: string
  invoice_pdf: string
}

export const BillingService = {
  async createCheckoutSession(
    priceId: string,
  ): Promise<{ sessionId: string; url: string }> {
    // In a real app, this calls a Supabase Edge Function which talks to Stripe
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: { priceId },
      },
    )

    if (error) throw error
    return data // { sessionId: 'cs_test_...', url: 'https://checkout.stripe.com/...' }
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscriptionId },
    })

    if (error) throw error
  },

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    // Fetch invoices from Supabase Function acting as proxy to Stripe
    const { data, error } = await supabase.functions.invoke('get-invoices')

    if (error) {
      logger.error(error, 'BillingService.getBillingHistory', {
        showToast: false,
      })
      return []
    }

    return data || []
  },
}
