import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Logger } from '@/services/logger'

interface LeadData {
  name: string
  email: string
  phone?: string
  weddingDate?: Date
  isBride?: boolean
}

interface UseLeadsReturn {
  submitLead: (data: LeadData) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

export function useLeads(): UseLeadsReturn {
  const [isLoading, setIsLoading] = useState(false)

  const submitLead = async (
    data: LeadData,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 1. Persist to Database
      const { data: client, error: dbError } = await supabase
        .from('wedding_clients')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          wedding_date: data.weddingDate?.toISOString(),
          is_bride: data.isBride,
          status: 'lead',
          user_id: user?.id,
        })
        .select()
        .single()

      if (dbError) throw new Error(dbError.message)

      // Audit the action
      if (user && client) {
        Logger.action(
          'LEAD_SUBMISSION',
          user.id,
          'wedding_clients',
          client.id,
          {
            email: data.email,
            is_bride: data.isBride,
          },
        )
      }

      // 2. Send Welcome Email
      if (data.isBride && client) {
        const { error: emailError } = await supabase.functions.invoke(
          'send-welcome-email',
          {
            body: {
              clientId: client.id,
              subject: 'KONTROL // Welcome',
            },
          },
        )

        if (emailError) throw new Error('Email dispatch failed')
      }

      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  return { submitLead, isLoading }
}
