import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/services/logger'

export function useOnboarding() {
  const _navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { _user } = useAuth()
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

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
    } catch (err) {
      logger.error(err, {
        message: 'Erro de conexão.',
      })
      setIsConnecting(false)
    }
  }

  const handleComplete = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    setIsCompleting(true)

    try {
      const typedSupabase = supabase
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
