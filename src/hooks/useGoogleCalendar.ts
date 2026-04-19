import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export const useGoogleCalendar = () => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkConnection = async () => {
    if (!user) {
      setIsConnected(false)
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('google_calendar_tokens')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    setIsConnected(!!data)
    setIsLoading(false)
  }

  const connectGoogleCalendar = async () => {
    setIsLoading(true)
    try {
      const redirectUri = `${window.location.origin}/calendar/callback`

      const { data, error } = await supabase.functions.invoke(
        'google-calendar-auth',
        {
          body: { action: 'get-auth-url', redirect_uri: redirectUri },
        },
      )

      if (error) throw error
      if (!data?.url) throw new Error('URL de autenticação não retornada')

      window.location.href = data.url
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao iniciar conexão com Google'
      toast.error(message)
      setIsLoading(false)
    }
  }

  const disconnectGoogleCalendar = async () => {
    if (!user) return
    setIsLoading(true)

    await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', user.id)

    setIsConnected(false)
    setIsLoading(false)
    toast.success('Google Calendar desconectado')
  }

  return {
    isConnected,
    isLoading,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    checkConnection,
  }
}
