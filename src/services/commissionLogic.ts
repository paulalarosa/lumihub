import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'

export class CommissionLogic {
  private static DEFAULT_COMMISSION_RATE = 0.15

  static calculateCommission(totalValue: number, customRate?: number): number {
    const rate = customRate || CommissionLogic.DEFAULT_COMMISSION_RATE
    return totalValue * rate
  }

  static async getFinancialReport(
    organizationId: string,
    _startDate?: Date,
    _endDate?: Date,
  ) {
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('user_id', organizationId)

      const totalRevenue = (invoices || []).reduce(
        (sum, inv) => sum + (Number(inv.amount) || 0),
        0,
      )

      return { totalRevenue, totalCommissions: 0 }
    } catch (e) {
      logger.error(e, {
        message: 'Erro ao gerar relatório financeiro.',
        context: { organizationId },
        showToast: false,
      })
      return { totalRevenue: 0, totalCommissions: 0 }
    }
  }

  static async getAssistantCommissions(
    _assistantId: string,
    _startDate?: Date,
    _endDate?: Date,
  ) {
    return { totalCommissions: 150 }
  }
}
