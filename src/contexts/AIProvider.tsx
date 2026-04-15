import React, { useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/services/logger'
import { useAuth } from '@/hooks/useAuth'

import { AIContext, AIProviderContextType, AIProviderMode } from './AIContext'

export function AIProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [mode, setMode] = useState<AIProviderMode>('cloud')
  const [byokSettings, setByokSettings] =
    useState<AIProviderContextType['byokSettings']>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setByokSettings(null)
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setByokSettings({
          provider: data.provider,
          apiKey: data.api_key || '',
          modelName: data.model_name || '',
        })
      } else {
        setByokSettings(null)
      }
    } catch (err) {
      logger.error('[AIProvider] Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const value = {
    mode,
    setMode,
    byokSettings,
    isLoading,
    refreshSettings: fetchSettings,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}
