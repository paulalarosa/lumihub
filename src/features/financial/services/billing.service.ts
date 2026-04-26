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
  // createCheckoutSession e cancelSubscription removidos (eram órfãos
  // com payload desalinhado da edge). Os callers reais vivem em
  // usePlanAccess (checkout) e useBilling/useCancelSubscription (cancel).

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
