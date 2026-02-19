import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export type AIProviderMode = 'cloud' | 'local'

interface AIProviderContextType {
  mode: AIProviderMode
  setMode: (mode: AIProviderMode) => void
  byokSettings: {
    provider: string
    apiKey: string
    modelName: string
  } | null
  isLoading: boolean
  refreshSettings: () => Promise<void>
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(
  undefined,
)

export function AIProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [mode, setMode] = useState<AIProviderMode>('cloud')
  const [byokSettings, setByokSettings] =
    useState<AIProviderContextType['byokSettings']>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = async () => {
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
      console.error('[AIProvider] Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const value = {
    mode,
    setMode,
    byokSettings,
    isLoading,
    refreshSettings: fetchSettings,
  }

  return (
    <AIProviderContext.Provider value={value}>
      {children}
    </AIProviderContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIProviderContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
