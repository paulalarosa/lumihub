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
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: { priceId },
      },
    )

    if (error) throw error
    return data
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscriptionId },
    })

    if (error) throw error
  },

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
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
