import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { Database } from '@/integrations/supabase/types'
import { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

type LocalDatabase = Database & {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
          subscription_tier: string | null
          onboarding_completed: boolean | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          subscription_tier?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          subscription_tier?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
  }
}

export function useOnboarding() {
  const _navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { _user } = useAuth()
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Check if we returned from Google Auth
  useEffect(() => {
    if (searchParams.get('google_connected') === 'true') {
      setStep(3)
      toast.success('Google Calendar conectado!')
    }
  }, [searchParams])

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        logger.error(error, {
          message: 'Erro ao conectar com Google Calendar.',
        })
        setIsConnecting(false)
        return
      }
      // Redirect is automatic
    } catch (err) {
      logger.error(err, {
        message: 'Erro de conexão.',
      })
      setIsConnecting(false)
    }
  }

  const handleComplete = async () => {
    // 1. Get freshet user data
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    setIsCompleting(true)

    try {
      // 2. UPSERT Profile (Critical Fix)
      const typedSupabase = supabase as unknown as SupabaseClient<LocalDatabase>
      const { error } = await typedSupabase.from('profiles').upsert(
        {
          id: userData.user.id,
          email: userData.user.email,
          full_name:
            userData.user.user_metadata?.full_name ||
            userData.user.email?.split('@')[0] ||
            'Profissional',
          role: 'professional',
          subscription_tier: 'trial',
          onboarding_completed: true,
          // has_completed_onboarding: true, // Legacy support
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )

      if (error) {
        logger.error(error, {
          message: 'Erro ao finalizar onboarding.',
        })
        setIsCompleting(false)
        return
      }

      // 3. FORCE REFRESH TO BREAK LOOP

      await supabase.auth.refreshSession()

      toast.success('Bem-vindo ao KONTROL!')
      window.location.href = '/dashboard'
    } catch (err) {
      logger.error(err, {
        message: 'Erro ao finalizar.',
      })
      setIsCompleting(false)
    }
  }

  const handleSkipCalendar = () => {
    setStep(3)
  }

  return {
    step,
    setStep,
    isConnecting,
    isCompleting,
    handleConnectGoogleCalendar,
    handleComplete,
    handleSkipCalendar,
  }
}
