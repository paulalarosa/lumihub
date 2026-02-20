// Marketing logic - simplified (some columns don't exist)

import { supabase } from '@/integrations/supabase/client'
import { subMonths, format } from 'date-fns'
import { logger } from '@/services/logger'

export interface MarketingTrigger {
  type: 'birthday' | 'reengagement' | 'anniversary'
  clientName: string
  clientId: string
  details: string
  date?: string
}

export class MarketingLogic {
  static async getTriggers(
    organizationId: string,
  ): Promise<MarketingTrigger[]> {
    const triggers: MarketingTrigger[] = []

    try {
      const today = new Date()
      const sixMonthsAgo = subMonths(today, 6)

      // Re-engagement based on created_at (simplified - birth_date doesn't exist)
      const { data: clients } = await supabase
        .from('wedding_clients')
        .select('id, name, created_at')
        .eq('user_id', organizationId)

      if (clients) {
        // Check for old clients without recent activity
        clients.forEach((c) => {
          const createdDate = new Date(c.created_at)
          if (createdDate < sixMonthsAgo) {
            triggers.push({
              type: 'reengagement',
              clientId: c.id,
              clientName: c.name,
              details: `Cliente desde: ${format(createdDate, 'dd/MM/yyyy')}`,
            })
          }
        })
      }
    } catch (error) {
      logger.error(error, {
        message: 'Erro ao carregar gatilhos de marketing.',
        context: { organizationId },
        showToast: false,
      })
    }

    return triggers
  }
}
